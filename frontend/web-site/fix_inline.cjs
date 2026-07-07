const fs = require('fs');
const files = [
  { p: 'src/components/Supplier/Order/DetailOrderModal/index.jsx', i: 'import { InlineSpinner } from "../../UI/SupplierSpinner";' },
  { p: 'src/components/Supplier/Order/OrderTable.jsx', i: 'import { InlineSpinner } from "../UI/SupplierSpinner";' },
  { p: 'src/pages/Supplier/SupplierInfoPage.jsx', i: 'import { InlineSpinner } from "../../components/Supplier/UI/SupplierSpinner";' }
];
files.forEach(f => {
  if (fs.existsSync(f.p)) {
    let content = fs.readFileSync(f.p, 'utf8');
    if (!content.includes('import { InlineSpinner }') && !content.includes('import {InlineSpinner}')) {
      fs.writeFileSync(f.p, f.i + '\n' + content);
      console.log('Fixed', f.p);
    }
  }
});
