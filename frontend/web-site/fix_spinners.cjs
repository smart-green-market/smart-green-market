const fs = require('fs');
const path = require('path');

const files = [
  {
    path: 'src/components/Supplier/Category/CreateCategoryModal.jsx',
    depth: 1, // ../UI/SupplierSpinner
  },
  {
    path: 'src/components/Supplier/Cultivation/CreateCultivationModal.jsx',
    depth: 1,
  },
  {
    path: 'src/components/Supplier/Cultivation/EditCultivationModal.jsx',
    depth: 1,
  },
  {
    path: 'src/components/Supplier/Discount/CreateQuantityDiscountModal.jsx',
    depth: 1,
  },
  {
    path: 'src/components/Supplier/Discount/EditQuantityDiscountModal.jsx',
    depth: 1,
  },
  {
    path: 'src/components/Supplier/Order/DetailOrderModal/components/ConfirmOrderModal.jsx',
    depth: 3,
  },
  {
    path: 'src/components/Supplier/Order/DetailOrderModal/index.jsx',
    depth: 2,
    isInline: true
  }
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${file.path} (not found)`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  
  const spinnerName = file.isInline ? 'InlineSpinner' : 'ButtonSpinner';
  const importStatement = `import { ${spinnerName} } from "${'../'.repeat(file.depth)}UI/SupplierSpinner";\n`;

  if (!content.includes(`import { ${spinnerName} }`) && !content.includes(`import {${spinnerName}}`)) {
    // Add import after the first import or at top
    if (content.startsWith('import')) {
      content = content.replace(/(import.*?;?\n)/, `$1${importStatement}`);
    } else {
      content = importStatement + content;
    }
    
    // special fix for CreateCategoryModal duplicate SVG
    if (file.path.includes('CreateCategoryModal')) {
      content = content.replace(/<svg className="animate-spin[^>]*>[\s\S]*?<\/svg>\s*<ButtonSpinner label="Đang lưu\.\.\." \/>/g, '<ButtonSpinner label="Đang lưu..." />');
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${file.path}`);
  }
});

// Fix existing incorrect imports
const fixIncorrect = [
  {
    path: 'src/components/Supplier/Order/DetailOrderModal/components/RejectOrderModal.jsx',
    from: /import \{ ButtonSpinner \} from ".*?UI\/SupplierSpinner";/,
    to: 'import { ButtonSpinner } from "../../../UI/SupplierSpinner";'
  },
  {
    path: 'src/components/Supplier/Order/DetailOrderModal/components/RejectPaymentModal.jsx',
    from: /import \{ ButtonSpinner \} from ".*?UI\/SupplierSpinner";/,
    to: 'import { ButtonSpinner } from "../../../UI/SupplierSpinner";'
  },
  {
    path: 'src/components/Supplier/Product/CreateProductModal/components/ModalFooter.jsx',
    from: /import \{ ButtonSpinner \} from ".*?UI\/SupplierSpinner";/,
    to: 'import { ButtonSpinner } from "../../../UI/SupplierSpinner";'
  }
];

fixIncorrect.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  if (file.from.test(content)) {
    content = content.replace(file.from, file.to);
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed import in ${file.path}`);
  }
});
