(function() {
    "use strict";

    // ----- ELEMENTS -----
    const woodTypeSelect = document.getElementById('woodTypeSelect');
    const thicknessSelect = document.getElementById('thicknessSelect');
    const priceInput = document.getElementById('priceInput');

    // ----- EFFECTIVE THICKNESS based on Sale/Purchase -----
    function getEffectiveThickness(baseThick) {
      const woodType = woodTypeSelect.value;
      if (woodType === 'sale') {
        return baseThick + 0.25;
      } else {
        return baseThick + 0.125;
      }
    }

    // ----- PRICE HANDLER -----
    window.handleWoodTypeChange = function() {
      priceInput.value = 470;
      calcAll();
    };

    // ----- MAIN CALCULATION ENGINE -----
    function calcAll() {
      let grandQty = 0, grandCFT = 0;

      // Process standard tables
      document.querySelectorAll('section.table-block[data-table-type="standard"]').forEach(block => {
        const width = parseFloat(block.dataset.width);
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

          let cft = (width * effectiveThick * len * qty) / 144;
          if (isNaN(cft)) cft = 0;
          row.querySelector('.cft').value = cft.toFixed(3);
          row.setAttribute('data-hide-print', qty === 0 ? 'true' : 'false');

          sumQty += qty;
          sumCFT += cft;
          totalRFT += len * qty;
        });

        sumQtyEl.textContent = sumQty;
        sumCFTEl.textContent = sumCFT.toFixed(3);
        totalRFTEl.textContent = totalRFT.toFixed(2);

        grandQty += sumQty;
        grandCFT += sumCFT;
      });

      // Process RFT table
      const rftSection = document.getElementById('rftTable');
      let totalRftSum = 0, totalCftRft = 0;

      rftSection.querySelectorAll('tbody tr').forEach(row => {
        const width = parseFloat(row.dataset.width);
        const rftInput = row.querySelector('.rftQty');
        const rftVal = parseFloat(rftInput.value) || 0;
        const baseThick = parseFloat(thicknessSelect.value);
        const effectiveThick = getEffectiveThickness(baseThick);

        let cft = (width * effectiveThick * rftVal) / 144;
        if (isNaN(cft)) cft = 0;
        row.querySelector('.cftRft').value = cft.toFixed(3);
        row.setAttribute('data-hide-print', rftVal === 0 ? 'true' : 'false');

        totalRftSum += rftVal;
        totalCftRft += cft;
      });

      document.getElementById('totalRftSum').textContent = totalRftSum.toFixed(2);
      document.getElementById('totalCftRft').textContent = totalCftRft.toFixed(3);
      grandCFT += totalCftRft;

      // Update grand totals
      document.getElementById('grandQty').textContent = grandQty;
      document.getElementById('grandCFT').textContent = grandCFT.toFixed(3);
      const price = parseFloat(priceInput.value) || 0;
      document.getElementById('grandPrice').textContent = (grandCFT * price).toFixed(2);
    }

    // ----- EVENT LISTENERS -----
    document.addEventListener('input', function(e) {
      if (e.target.classList.contains('qty') || 
          e.target.classList.contains('rftQty') || 
          e.target === priceInput || 
          e.target === thicknessSelect || 
          e.target === woodTypeSelect) {
        calcAll();
      }
    });

    window.handleWoodTypeChange();

    // RESET BUTTON
    document.getElementById('resetBtn').addEventListener('click', function() {
      document.querySelectorAll('.qty, .rftQty').forEach(i => i.value = '');
      document.querySelectorAll('.cft, .cftRft').forEach(i => i.value = '');
      document.querySelectorAll('.sumQty').forEach(el => el.textContent = '0');
      document.querySelectorAll('.sumCFT').forEach(el => el.textContent = '0.000');
      document.querySelectorAll('.totalRFT').forEach(el => el.textContent = '0.00');
      document.getElementById('totalRftSum').textContent = '0.00';
      document.getElementById('totalCftRft').textContent = '0.000';
      document.getElementById('grandQty').textContent = '0';
      document.getElementById('grandCFT').textContent = '0.000';
      document.getElementById('grandPrice').textContent = '0.00';
      priceInput.value = 470;
      woodTypeSelect.value = 'sale';
      thicknessSelect.value = '1';
      calcAll();
    });

    // PRINT
    document.getElementById('printBtn').addEventListener('click', function() {
      window.print();
    });

    // EXPORT CSV
    document.getElementById('excelBtn').addEventListener('click', function() {
      let csv = "Wood Type,Size / Width,Quantity / RFT,CFT\n";
      
      document.querySelectorAll('section.table-block[data-table-type="standard"] tbody tr').forEach(row => {
        const woodLabel = row.cells[0]?.innerText || '';
        const size = row.cells[1]?.innerText || '';
        const qty = row.querySelector('.qty')?.value || 0;
        const cft = row.querySelector('.cft')?.value || 0;
        if (parseFloat(qty) !== 0) {
          csv += `${woodLabel},${size},${qty},${cft}\n`;
        }
      });
      
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

    // Initial calculation
    calcAll();
})();