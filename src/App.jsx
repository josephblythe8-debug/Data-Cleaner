import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Copy, Download, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const COLOURS = [
  { code: 'AM', name: 'Amber' },
  { code: 'BE', name: 'Blue' },
  { code: 'BG', name: 'Beige' },
  { code: 'BK', name: 'Black' },
  { code: 'BO', name: 'Bottle' },
  { code: 'BR', name: 'Brown' },
  { code: 'CR', name: 'Cream / Ecru (not in official table)' },
  { code: 'DG', name: 'Dark Grey' },
  { code: 'GN', name: 'Green' },
  { code: 'GO', name: 'Gold' },
  { code: 'GY', name: 'Grey' },
  { code: 'ME', name: 'Marine' },
  { code: 'MN', name: 'Maroon' },
  { code: 'MU', name: 'Multi' },
  { code: 'OR', name: 'Orange' },
  { code: 'PK', name: 'Pink' },
  { code: 'PP', name: 'Purple' },
  { code: 'RD', name: 'Red' },
  { code: 'RO', name: 'Royal' },
  { code: 'SK', name: 'Sky' },
  { code: 'SV', name: 'Silver' },
  { code: 'WH', name: 'White' },
  { code: 'YW', name: 'Yellow' },
];

const SWATCH_HEX = {
  AM: '#C68A2E', BE: '#3A5FA0', BG: '#D8C7A1', BK: '#111111', BO: '#1F4D3A',
  BR: '#5C4128', CR: '#EFE6D4', DG: '#4A4A4A', GN: '#2E7D45', GO: '#C9A227',
  GY: '#8A8A8A', ME: '#12253F', MN: '#6E1F2A', MU: 'conic-gradient(#c33,#3a5fa0,#2e7d45,#c9a227)',
  OR: '#D2691E', PK: '#E0729A', PP: '#6A3B8C', RD: '#C0272D', RO: '#1B3F91',
  SK: '#7EC0E0', SV: '#B7B7B7', WH: '#F5F5F5', YW: '#E8C22A', XX: 'transparent',
};

const SIZE_CATEGORIES = [
  {
    id: 'kids',
    label: 'Kids / age',
    sizes: [
      { code: '56', label: 'Age 5-6' },
      { code: '78', label: 'Age 7-8' },
      { code: '910', label: 'Age 9-10' },
      { code: '1011', label: 'Age 10-11' },
      { code: '13', label: 'Age 13' },
    ],
  },
  {
    id: 'unisex',
    label: 'Unisex adult',
    sizes: [
      { code: 'XS', label: 'X-Small' },
      { code: 'S', label: 'Small' },
      { code: 'M', label: 'Medium' },
      { code: 'L', label: 'Large' },
      { code: 'XL', label: 'X-Large' },
      { code: '2XL', label: '2X-Large' },
      { code: '3XL', label: '3X-Large' },
      { code: '4XL', label: '4X-Large' },
      { code: '5XL', label: '5X-Large' },
      { code: '6XL', label: '6X-Large' },
    ],
  },
  {
    id: 'ladiesNum',
    label: 'Ladies (numeric)',
    sizes: [6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((n) => ({
      code: `L${n}`,
      label: `Ladies ${n}`,
    })),
  },
  {
    id: 'ladiesLetter',
    label: 'Ladies (letter)',
    sizes: [
      { code: 'L2XS', label: 'Ladies2XS' },
      { code: 'LXS', label: 'LadiesXS' },
      { code: 'LS', label: 'LadiesS' },
      { code: 'LM', label: 'LadiesM' },
      { code: 'LL', label: 'LadiesL' },
      { code: 'LXL', label: 'LadiesXL' },
      { code: 'L2XL', label: 'Ladies2XL' },
      { code: 'L3XL', label: 'Ladies3XL' },
    ],
  },
  {
    id: 'osfa',
    label: 'One size',
    sizes: [{ code: 'OS', label: 'OSFA (One Size Fits All)' }],
  },
];

const emptyForm = {
  teamCode: '',
  clubName: '',
  productName: '',
  price: '',
  rangeCode: '',
  styleCode: '',
};

function csvField(value) {
  const v = String(value ?? '');
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function generateColourCode(name, usedCodes) {
  const clean = name.trim().toUpperCase().replace(/[^A-Z ]/g, '');
  if (!clean) return '';
  const words = clean.split(/\s+/).filter(Boolean);
  const first = words[0];
  const candidates = [];
  if (words.length > 1) candidates.push(words[0][0] + words[1][0]);
  if (first.length >= 2) candidates.push(first.slice(0, 2));
  for (let i = 1; i < first.length; i++) candidates.push(first[0] + first[i]);
  const last = words[words.length - 1];
  if (last !== first) candidates.push(first[0] + last[last.length - 1]);
  for (let c = 65; c <= 90; c++) candidates.push(first[0] + String.fromCharCode(c));

  const seen = new Set();
  const unique = candidates.filter((c) => {
    if (c.length !== 2 || seen.has(c)) return false;
    seen.add(c);
    return true;
  });
  for (const cand of unique) {
    if (cand !== 'XX' && !usedCodes.includes(cand)) return cand;
  }
  return unique[0] || 'XX';
}

export default function SkuGenerator() {
  const [form, setForm] = useState(emptyForm);
  const [colours, setColours] = useState(['', '', '']);
  const [customColours, setCustomColours] = useState([{ name: '', code: '' }, { name: '', code: '' }, { name: '', code: '' }]);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [products, setProducts] = useState([]);
  const [openCats, setOpenCats] = useState({ kids: true, unisex: true, ladiesNum: false, ladiesLetter: false, osfa: true });
  const [saveStatus, setSaveStatus] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sku_generator_products');
      if (saved) setProducts(JSON.parse(saved));
    } catch (e) {
      // no saved data yet
    }
    try {
      const savedClub = localStorage.getItem('sku_generator_lastclub');
      if (savedClub) {
        const parsed = JSON.parse(savedClub);
        setForm((f) => ({ ...f, teamCode: parsed.teamCode || '', clubName: parsed.clubName || '' }));
      }
    } catch (e) {
      // no saved data yet
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem('sku_generator_products', JSON.stringify(products));
    } catch (e) {
      setSaveStatus('Could not save — data will be lost on refresh');
    }
  }, [products, loaded]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        'sku_generator_lastclub',
        JSON.stringify({ teamCode: form.teamCode, clubName: form.clubName })
      );
    } catch (e) {
      // non-critical
    }
  }, [form.teamCode, form.clubName, loaded]);

  const colourCode = useMemo(
    () =>
      colours
        .map((c, i) => {
          if (c === 'CUSTOM') return (customColours[i].code || 'XX').toUpperCase().slice(0, 2).padEnd(2, 'X');
          return c || 'XX';
        })
        .join(''),
    [colours, customColours]
  );

  const chosenSizes = useMemo(() => {
    const list = [];
    SIZE_CATEGORIES.forEach((cat) => {
      cat.sizes.forEach((s) => {
        if (selectedSizes[s.code]) list.push(s);
      });
    });
    return list;
  }, [selectedSizes]);

  const baseSku =
    form.rangeCode && form.styleCode && form.teamCode
      ? `${form.rangeCode}-${form.styleCode}-0-${form.teamCode}-${colourCode}-ALL`
      : `${form.rangeCode || 'RANGE'}-${form.styleCode || 'STYLE'}-0-${form.teamCode || 'TEAM'}-${colourCode}-ALL`;

  const officialCodes = useMemo(() => COLOURS.map((c) => c.code), []);

  const handleCustomNameChange = (i, name) => {
    const next = customColours.map((c) => ({ ...c }));
    next[i].name = name;
    const usedElsewhere = [];
    for (let j = 0; j < 3; j++) {
      if (j === i) continue;
      if (colours[j] === 'CUSTOM') {
        if (next[j].code) usedElsewhere.push(next[j].code);
      } else if (colours[j]) {
        usedElsewhere.push(colours[j]);
      }
    }
    next[i].code = name.trim() ? generateColourCode(name, [...officialCodes, ...usedElsewhere]) : '';
    setCustomColours(next);
  };

  const toggleSize = (code) => {
    setSelectedSizes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleCategoryAll = (cat, value) => {
    setSelectedSizes((prev) => {
      const next = { ...prev };
      cat.sizes.forEach((s) => {
        next[s.code] = value;
      });
      return next;
    });
  };

  const catAllOn = (cat) => cat.sizes.every((s) => selectedSizes[s.code]);
  const catSomeOn = (cat) => cat.sizes.some((s) => selectedSizes[s.code]);

  const errors = [];
  if (!form.teamCode.trim()) errors.push('Team code');
  if (!form.clubName.trim()) errors.push('Club name');
  if (!form.productName.trim()) errors.push('Product name');
  if (!form.price || Number(form.price) <= 0) errors.push('Price');
  if (!form.rangeCode.trim()) errors.push('Range code');
  if (!form.styleCode.trim()) errors.push('Style code');
  if (chosenSizes.length === 0) errors.push('At least one size');
  colours.forEach((c, i) => {
    if (c === 'CUSTOM' && customColours[i].code.trim().length !== 2) errors.push(`Custom colour ${i + 1} name`);
  });

  const addProduct = () => {
    if (errors.length > 0) return;
    const teamCode = form.teamCode.trim().toUpperCase();
    const clubName = form.clubName.trim();
    const newProduct = {
      id: Date.now() + Math.random(),
      teamCode,
      clubName,
      productName: form.productName.trim(),
      price: form.price,
      rangeCode: form.rangeCode.trim().toUpperCase(),
      styleCode: form.styleCode.trim().toUpperCase(),
      colourCode,
      colourNames: colours
        .map((c, i) => {
          if (c === 'CUSTOM') return customColours[i].name.trim();
          if (!c) return '';
          return COLOURS.find((x) => x.code === c)?.name.split(' (')[0] || c;
        })
        .filter(Boolean)
        .join(' / '),
      sizes: chosenSizes,
    };
    setProducts((prev) => [...prev, newProduct]);
    setForm((f) => ({ ...emptyForm, teamCode: f.teamCode, clubName: f.clubName }));
    setColours(['', '', '']);
    setCustomColours([{ name: '', code: '' }, { name: '', code: '' }, { name: '', code: '' }]);
    setSelectedSizes({});
  };

  const removeProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id));

  const duplicateForRecolour = (p) => {
    setForm({
      teamCode: p.teamCode,
      clubName: p.clubName,
      productName: p.productName,
      price: p.price,
      rangeCode: p.rangeCode,
      styleCode: p.styleCode,
    });
    const codes = [];
    for (let i = 0; i < p.colourCode.length; i += 2) codes.push(p.colourCode.slice(i, i + 2));
    const knownCodes = COLOURS.map((c) => c.code);
    const nextColours = ['', '', ''];
    const nextCustom = [{ name: '', code: '' }, { name: '', code: '' }, { name: '', code: '' }];
    codes.forEach((code, i) => {
      if (!code || code === 'XX') return;
      if (knownCodes.includes(code)) {
        nextColours[i] = code;
      } else {
        nextColours[i] = 'CUSTOM';
        nextCustom[i] = { name: '', code };
      }
    });
    setColours(nextColours);
    setCustomColours(nextCustom);
    const sizeMap = {};
    p.sizes.forEach((s) => (sizeMap[s.code] = true));
    setSelectedSizes(sizeMap);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalSkuRows = products.reduce((sum, p) => sum + p.sizes.length, 0);

  const buildCsv = () => {
    const header = 'Item Type,Product ID,Product Name,Product Type,Product Code/SKU,Price,Product Weight,Allow Purchases,Track Inventory,Category,Brand Name';
    const rows = [header];
    products.forEach((p) => {
      const productNameFull = `${p.teamCode} - ${p.clubName} - ${p.productName}`;
      const categoryFull = `${p.teamCode} - ${p.clubName} `;
      const sku = `${p.rangeCode}-${p.styleCode}-0-${p.teamCode}-${p.colourCode}-ALL`;
      rows.push(
        [
          'product',
          '',
          csvField(productNameFull),
          'P',
          sku,
          p.price,
          '0.75',
          'Y',
          'none',
          csvField(categoryFull),
          "O'Neills",
        ].join(',')
      );
      p.sizes.forEach((s) => {
        const variantSku = `${p.rangeCode}-${p.styleCode}-0-${p.teamCode}-${p.colourCode}-${s.code}`;
        rows.push(['SKU', '', csvField(`[S]Size=${s.label}`), '', variantSku, '', '', '', '', '', ''].join(','));
      });
    });
    return '\ufeff' + rows.join('\r\n') + '\r\n';
  };

  const exportCsv = () => {
    const csv = buildCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const teamCode = products[0]?.teamCode || form.teamCode.trim().toUpperCase() || 'ClubHub';
    a.href = url;
    a.download = `${teamCode}_Product_Upload.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (window.confirm('Clear all products from this list? This cannot be undone.')) {
      setProducts([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Aptos Narrow','Segoe UI',sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">ClubHub SKU generator</h1>
            <p className="text-sm text-slate-500">Build a product upload CSV, formatted exactly to spec</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div>{products.length} products · {totalSkuRows} SKU rows</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Club</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Team code</label>
                  <input
                    value={form.teamCode}
                    onChange={(e) => setForm({ ...form, teamCode: e.target.value.toUpperCase() })}
                    placeholder="SHWD"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Club name</label>
                  <input
                    value={form.clubName}
                    onChange={(e) => setForm({ ...form, clubName: e.target.value })}
                    placeholder="Sherwood AFC"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Product</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Product name</label>
                  <input
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="Anzac Guernsey"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="89"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Range code</label>
                    <input
                      value={form.rangeCode}
                      onChange={(e) => setForm({ ...form, rangeCode: e.target.value.toUpperCase() })}
                      placeholder="TEAM"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Style code</label>
                    <input
                      value={form.styleCode}
                      onChange={(e) => setForm({ ...form, styleCode: e.target.value.toUpperCase() })}
                      placeholder="258"
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Colours <span className="text-xs font-normal text-slate-400">(up to 3 — unused slots become XX)</span></h2>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i}>
                    <select
                      value={colours[i]}
                      onChange={(e) => {
                        const next = [...colours];
                        next[i] = e.target.value;
                        setColours(next);
                      }}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">— none —</option>
                      {COLOURS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} · {c.name}
                        </option>
                      ))}
                      <option value="CUSTOM">✎ Custom colour...</option>
                    </select>
                    {colours[i] === 'CUSTOM' ? (
                      <div className="mt-1.5 space-y-1">
                        <input
                          value={customColours[i].name}
                          onChange={(e) => handleCustomNameChange(i, e.target.value)}
                          placeholder="Colour name"
                          className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0 bg-white" />
                          <span className="text-xs font-mono text-slate-500">
                            {customColours[i].code || '—'}
                          </span>
                          <span className="text-[10px] text-slate-400">auto</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0"
                          style={{ background: colours[i] ? SWATCH_HEX[colours[i]] : '#fff' }}
                        />
                        <span className="text-xs font-mono text-slate-500">{colours[i] || 'XX'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {colours.includes('CR') && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                  <AlertCircle size={12} /> CR isn't in the official colour table — confirm with Kendall before import.
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Sizes</h2>
              <div className="space-y-2">
                {SIZE_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="border border-slate-200 rounded">
                    <button
                      type="button"
                      onClick={() => setOpenCats((o) => ({ ...o, [cat.id]: !o[cat.id] }))}
                      className="w-full flex items-center justify-between px-3 py-2 text-left"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={catAllOn(cat)}
                          ref={(el) => {
                            if (el) el.indeterminate = catSomeOn(cat) && !catAllOn(cat);
                          }}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleCategoryAll(cat, !catAllOn(cat));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded"
                        />
                        <span className="font-medium text-slate-700">{cat.label}</span>
                        <span className="text-xs text-slate-400">
                          ({cat.sizes.filter((s) => selectedSizes[s.code]).length}/{cat.sizes.length})
                        </span>
                      </span>
                      {openCats[cat.id] ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>
                    {openCats[cat.id] && (
                      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
                        {cat.sizes.map((s) => (
                          <label
                            key={s.code}
                            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded cursor-pointer border ${
                              selectedSizes[s.code] ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={!!selectedSizes[s.code]}
                              onChange={() => toggleSize(s.code)}
                              className="hidden"
                            />
                            {s.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Base SKU preview</div>
              <div className="font-mono text-sm text-slate-800 break-all mb-3">{baseSku}</div>
              <div className="flex flex-wrap gap-1 text-[10px] text-slate-400 mb-3">
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">RANGE</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">STYLE</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">0</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">TEAM</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">COLOUR ×3</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded">SIZE</span>
              </div>
              {errors.length > 0 && (
                <p className="text-xs text-amber-600 flex items-start gap-1 mb-3">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" /> Missing: {errors.join(', ')}
                </p>
              )}
              <button
                onClick={addProduct}
                disabled={errors.length > 0}
                className={`w-full flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium ${
                  errors.length > 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                <Plus size={16} /> Add product to list
              </button>
            </div>
          </div>

          {/* Right: product list */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {saveStatus && <span className="text-amber-600">{saveStatus}</span>}
                {!saveStatus && 'Saved automatically as you go'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  disabled={products.length === 0}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear list
                </button>
                <button
                  onClick={exportCsv}
                  disabled={products.length === 0}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {products.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-sm text-slate-400">
                No products added yet. Fill in the form on the left and add your first product.
              </div>
            )}

            {products.map((p) => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm text-slate-800">
                      {p.teamCode} - {p.clubName} - {p.productName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      ${p.price} · {p.colourNames || 'No colour'} · {p.sizes.length} sizes
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => duplicateForRecolour(p)}
                      title="Load into form to recolour"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => removeProduct(p.id)}
                      title="Remove"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="font-mono text-xs text-slate-600 bg-slate-50 rounded px-2 py-1.5 mb-2 break-all">
                  {p.rangeCode}-{p.styleCode}-0-{p.teamCode}-{p.colourCode}-ALL
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.sizes.map((s) => (
                    <span key={s.code} className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {s.code}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
