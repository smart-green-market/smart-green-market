const fs = require('fs');
const path = require('path');

const filesToFix = [
  {
    path: 'src/components/Supplier/Discount/EditQuantityDiscountModal.jsx',
    importPath: '../UI/SupplierSpinner'
  },
  {
    path: 'src/components/Supplier/Discount/QuantityDiscountDetailModal.jsx',
    importPath: '../UI/SupplierSpinner'
  },
  {
    path: 'src/components/Supplier/Notification/NotificationTable.jsx',
    importPath: '../UI/SupplierSpinner'
  },
  {
    path: 'src/components/Supplier/Product/ListOrderModal.jsx',
    importPath: '../UI/SupplierSpinner'
  }
];

filesToFix.forEach(f => {
  const fullPath = path.join(__dirname, f.path);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes('import { PageSpinner }') && !content.includes('import {PageSpinner}')) {
      const importStatement = `import { PageSpinner } from "${f.importPath}";\n`;
      if (content.startsWith('import')) {
        content = content.replace(/(import.*?;?\n)/, `$1${importStatement}`);
      } else {
        content = importStatement + content;
      }
      fs.writeFileSync(fullPath, content);
      console.log('Fixed', f.path);
    }
  }
});
