(function() {
    "use strict";

    // ----- ELEMENTS -----
    const woodTypeSelect = document.getElementById('woodTypeSelect');
    const thicknessSelect = document.getElementById('thicknessSelect');
    const priceInput = document.getElementById('priceInput');

    // ----- EFFECTIVE THICKNESS based on Sale/Purchase (point 4) -----
    function getEffectiveThickness(baseThick) {
      const woodType = woodTypeSelect.value; // 'sale' or 'purchase'
      if (woodType === 'sale') {
        return baseThick + 0.25;   // Sales: +0.25
      } else {
        return baseThick + 0.125;  // Purchase: +0.125
      }
    }

    // ----- PRICE HANDLER: default 470 when Sale/Purchase, but keep editable -----
    window.handleWoodTypeChange = function() {
      // price set to 470 (as requested), but user can modify
      priceInput.value = 470;
      calcAll(); // re-calc with new thickness offset
    };

    // ----- MAIN CALCULATION ENGINE -----
    function calcAll() {
      let grandQty = 0, grandCFT = 0;

      // 1) process standard tables (6",5",2x3 Dasa)
      document.querySelectorAll('section.table-block[data-table-type="standard"]').forEach(block => {
        const width = parseFloat(block.dataset.width); // 6,5,3 etc.
        const sumQtyEl = block.querySelector('.sumQty');
        const sumCFTEl = block.querySelector('.sumCFT');
        const totalRFTEl = block.querySelector('.totalRFT');

        let sumQty = 0, sumCFT = 0, totalRFT = 0;

        block.querySelectorAll('tbody tr').forEach(row => {
          const len = parseFloat(row.dataset.len);
          const qtyInput = row.querySelector('.qty');
          const qty = parseFloat(qtyInput.value) || 0;
          const baseThick = parseFloat(thicknessSelect.value);
          const effectiveThick = getEffectiveThickness(baseThick);

          // CFT = width * effectiveThick * len * qty / 144
          let cft = (width * effectiveThick * len * qty) / 144;
          if (isNaN(cft)) cft = 0;
          row.querySelector('.cft').value = cft.toFixed(3);

          // mark for print: if qty = 0, hide row in print
          row.setAttribute('data-hide-print', qty === 0 ? 'true' : 'false');

          sumQty += qty;
          sumCFT += cft;
          totalRFT += len * qty;   // total running feet (point 3: single total RFT)
        });

        sumQtyEl.textContent = sumQty;
        sumCFTEl.textContent = sumCFT.toFixed(3);
        totalRFTEl.textContent = totalRFT.toFixed(2);

        grandQty += sumQty;
        grandCFT += sumCFT;
      });

      // 2) NEW table : 2",3",4" RFT input (point 2)
      const rftSection = document.getElementById('rftTable');
      let totalRftSum = 0, totalCftRft = 0;

      rftSection.querySelectorAll('tbody tr').forEach(row => {
        const width = parseFloat(row.dataset.width); // 2,3,4
        const rftInput = row.querySelector('.rftQty');
        const rftVal = parseFloat(rftInput.value) || 0;
        const baseThick = parseFloat(thicknessSelect.value);
        const effectiveThick = getEffectiveThickness(baseThick);

        // CFT = width * effectiveThick * RFT / 144
        let cft = (width * effectiveThick * rftVal) / 144;
        if (isNaN(cft)) cft = 0;
        row.querySelector('.cftRft').value = cft.toFixed(3);

        // for print: hide if RFT = 0
        row.setAttribute('data-hide-print', rftVal === 0 ? 'true' : 'false');

        totalRftSum += rftVal;
        totalCftRft += cft;
      });

      document.getElementById('totalRftSum').textContent = totalRftSum.toFixed(2);
      document.getElementById('totalCftRft').textContent = totalCftRft.toFixed(3);

      // add RFT table totals to grand totals
      grandQty += 0; // no 'pcs' for RFT table, only feet. Grand Qty = pcs from standard tables only
      grandCFT += totalCftRft;

      // update grand totals
      document.getElementById('grandQty').textContent = grandQty;
      document.getElementById('grandCFT').textContent = grandCFT.toFixed(3);
      const price = parseFloat(priceInput.value) || 0;
      document.getElementById('grandPrice').textContent = (grandCFT * price).toFixed(2);
    }

    // ----- EVENT LISTENERS -----
    // input events on quantity / rft / price / thickness / wood type
    document.addEventListener('input', function(e) {
      if (e.target.classList.contains('qty') || 
          e.target.classList.contains('rftQty') || 
          e.target === priceInput || 
          e.target === thicknessSelect || 
          e.target === woodTypeSelect) {
        calcAll();
      }
    });

    // also when woodTypeSelect changes (via onchange) we already call handleWoodTypeChange which triggers calcAll
    window.handleWoodTypeChange(); // set default price = 470 and calc

    // RESET BUTTON
    document.getElementById('resetBtn').addEventListener('click', function() {
      // reset all qty and rft inputs
      document.querySelectorAll('.qty, .rftQty').forEach(i => i.value = '');
      document.querySelectorAll('.cft, .cftRft').forEach(i => i.value = '');
      // reset summary fields
      document.querySelectorAll('.sumQty').forEach(el => el.textContent = '0');
      document.querySelectorAll('.sumCFT').forEach(el => el.textContent = '0.000');
      document.querySelectorAll('.totalRFT').forEach(el => el.textContent = '0.00');
      document.getElementById('totalRftSum').textContent = '0.00';
      document.getElementById('totalCftRft').textContent = '0.000';
      // reset grand
      document.getElementById('grandQty').textContent = '0';
      document.getElementById('grandCFT').textContent = '0.000';
      document.getElementById('grandPrice').textContent = '0.00';
      priceInput.value = 470;   // set default price to 470 as requested
      woodTypeSelect.value = 'sale';  // default sales
      thicknessSelect.value = '1';    // default 1"
      calcAll(); // force recalc with defaults
    });

    // ----- PRINT: legal page, hide zero rows (point 6) -----
    document.getElementById('printBtn').addEventListener('click', function() {
      window.print();
    });

    // ----- EXPORT CSV (simple) -----
    document.getElementById('excelBtn').addEventListener('click', function() {
      let csv = "Wood Type,Size / Width,Quantity / RFT,CFT\n";
      // standard tables
      document.querySelectorAll('section.table-block[data-table-type="standard"] tbody tr').forEach(row => {
        const woodLabel = row.cells[0]?.innerText || '';
        const size = row.cells[1]?.innerText || '';
        const qty = row.querySelector('.qty')?.value || 0;
        const cft = row.querySelector('.cft')?.value || 0;
        if (parseFloat(qty) !== 0) {
          csv += `${woodLabel},${size},${qty},${cft}\n`;
        }
      });
      // RFT table
      document.querySelectorAll('#rftTable tbody tr').forEach(row => {
        const widthLabel = row.cells[0]?.innerText || '';
        const rft = row.querySelector('.rftQty')?.value || 0;
        const cft = row.querySelector('.cftRft')?.value || 0;
        if (parseFloat(rft) !== 0) {
          csv += `${widthLabel},RFT input,${rft},${cft}\n`;
        }
      });
      const link = document.createElement('a');
      link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
      link.download = "wood_calc.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // set year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    // initial calculation
    calcAll();
  })();