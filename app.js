const ADMIN_CC = 'adminteam@oneills.com';

const MOQ_RULES = {
  SUBLIMATED: 12,
  COTTON_RUGBY_JERSEY: 20,
  WAREHOUSE_STOCK: 0,
  IRELAND_STOCK: 6,
  SOCKS: 16
};

let productMappings = JSON.parse(localStorage.getItem('clubhub_product_mappings') || '{}');
let lastAgent = null;
let moqAnalysis = null;

const orderInput = document.getElementById('orderInput');
const runButton = document.getElementById('runButton');
const validationBanner = document.getElementById('validationBanner');
const moqBanner = document.getElementById('moqBanner');
const resultsBody = document.getElementById('resultsBody');
const mappingForm = document.getElementById('mappingForm');
const mappingProduct = document.getElementById('mappingProduct');
const mappingType = document.getElementById('mappingType');
const mappingList = document.getElementById('mappingList');
const notifyAdminBtn = document.getElementById('notifyAdminBtn');
const orderFileInput = document.getElementById('orderFileInput');
const uploadedFileName = document.getElementById('uploadedFileName');

const PRODUCT_TYPE_KEYWORDS = {
  SOCKS: ['sock'],
  COTTON_RUGBY_JERSEY: ['rugby jersey', 'cotton jersey', 'rugby shirt'],
  SUBLIMATED: ['sublimated', 'sublimation'],
  IRELAND_STOCK: ['ireland stock', 'ireland warehouse'],
  WAREHOUSE_STOCK: ['warehouse stock', 'ex-stock', 'stock item']
};

function detectProductType(productName) {
  if (!productName) return null;
  const key = productName.trim();
  if (productMappings[key]) return productMappings[key];

  const normalised = key.toLowerCase();
  for (const [type, keywords] of Object.entries(PRODUCT_TYPE_KEYWORDS)) {
    if (keywords.some(kw => normalised.includes(kw))) return type;
  }
  return null;
}

function isHeaderRow(line) {
  const firstCell = line.split(',')[0].trim().toLowerCase();
  return firstCell === 'product' || firstCell === 'product name';
}

function parseOrderInput(raw) {
  const lines = raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length && isHeaderRow(lines[0])) lines.shift();

  return lines.map(line => {
    const parts = line.split(',').map(p => p.trim());
    const product = parts[0] || '';
    const qty = Number(parts[1]);
    return { product, qty: Number.isFinite(qty) ? qty : NaN };
  });
}

function validateOrder(items) {
  const issues = [];
  if (items.length === 0) {
    issues.push('Order is empty. Paste at least one line as "Product Name, Quantity".');
  }
  items.forEach((item, i) => {
    if (!item.product) issues.push(`Line ${i + 1}: missing product name.`);
    if (!Number.isFinite(item.qty) || item.qty <= 0) {
      issues.push(`Line ${i + 1}: quantity must be a positive number.`);
    }
  });
  return { valid: issues.length === 0, issues };
}

function analyseMOQ(items) {
  const violations = [];
  items.forEach((item, i) => {
    if (!Number.isFinite(item.qty)) return;
    const type = detectProductType(item.product);
    if (!type) return;
    const moq = MOQ_RULES[type];
    if (moq && item.qty < moq) {
      violations.push({
        line: i + 1,
        product: item.product,
        type,
        qty: item.qty,
        moq
      });
    }
  });
  return { hasViolations: violations.length > 0, violations };
}

function showBanner(banner, message) {
  banner.textContent = message;
  banner.classList.remove('hidden');
}

function hideBanner(banner) {
  banner.classList.add('hidden');
  banner.textContent = '';
}

function renderResults(items, moq) {
  resultsBody.innerHTML = '';
  items.forEach((item, i) => {
    const type = detectProductType(item.product);
    const moqRequired = type ? MOQ_RULES[type] : null;
    const violation = moq.violations.find(v => v.line === i + 1);
    const row = document.createElement('tr');
    if (violation) row.classList.add('row-warning');

    const cells = [
      String(i + 1),
      item.product || '(missing)',
      Number.isFinite(item.qty) ? String(item.qty) : '(invalid)',
      type || '(unmapped)',
      moqRequired === null || moqRequired === undefined ? '-' : String(moqRequired),
      violation ? 'Below MOQ' : 'OK'
    ];

    cells.forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      row.appendChild(td);
    });

    resultsBody.appendChild(row);
  });
}

function buildNotifyAdminLink(violations) {
  const subject = encodeURIComponent('ClubHub order: MOQ violations require review');
  const lines = violations.map(v =>
    `Line ${v.line}: ${v.product} - ordered ${v.qty}, requires ${v.moq} (${v.type})`
  );
  const body = encodeURIComponent(
    `The following order lines are below the minimum order quantity:\n\n${lines.join('\n')}`
  );
  return `mailto:?cc=${encodeURIComponent(ADMIN_CC)}&subject=${subject}&body=${body}`;
}

function runAgent() {
  const items = parseOrderInput(orderInput.value);
  const validation = validateOrder(items);

  const agent = {
    timestamp: new Date().toISOString(),
    items,
    validation
  };
  lastAgent = agent;

  if (!validation.valid) {
    showBanner(validationBanner, validation.issues.join(' '));
  } else {
    hideBanner(validationBanner);
  }

  // MOQ analysis block
  moqAnalysis = analyseMOQ(items);
  if (moqAnalysis.hasViolations) {
    const summary = moqAnalysis.violations
      .map(v => `${v.product} (${v.qty}/${v.moq})`)
      .join(', ');
    showBanner(moqBanner, `MOQ not met for: ${summary}`);
    notifyAdminBtn.href = buildNotifyAdminLink(moqAnalysis.violations);
    notifyAdminBtn.classList.remove('hidden');
  } else {
    hideBanner(moqBanner);
    notifyAdminBtn.classList.add('hidden');
  }

  renderResults(items, moqAnalysis);
}

function saveMappings() {
  localStorage.setItem('clubhub_product_mappings', JSON.stringify(productMappings));
}

function renderMappings() {
  mappingList.innerHTML = '';
  Object.entries(productMappings).forEach(([product, type]) => {
    const li = document.createElement('li');

    const label = document.createElement('span');
    label.textContent = `${product} → ${type}`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.dataset.product = product;
    removeBtn.classList.add('remove-mapping');

    li.appendChild(label);
    li.appendChild(removeBtn);
    mappingList.appendChild(li);
  });
}

mappingForm.addEventListener('submit', e => {
  e.preventDefault();
  const product = mappingProduct.value.trim();
  const type = mappingType.value;
  if (!product || !type) return;
  productMappings[product] = type;
  saveMappings();
  renderMappings();
  mappingForm.reset();
});

mappingList.addEventListener('click', e => {
  if (e.target.matches('.remove-mapping')) {
    delete productMappings[e.target.dataset.product];
    saveMappings();
    renderMappings();
  }
});

orderFileInput.addEventListener('change', () => {
  const file = orderFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    orderInput.value = reader.result;
    uploadedFileName.textContent = file.name;
    runAgent();
  };
  reader.onerror = () => {
    showBanner(validationBanner, `Could not read file "${file.name}".`);
  };
  reader.readAsText(file);
});

runButton.addEventListener('click', runAgent);

renderMappings();
