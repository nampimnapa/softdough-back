const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
require('dotenv').config();

const host = process.env.DATABASE_HOST;
const port = process.env.DATABASE_PORT;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASSWORD;
const database = process.env.DATABASE_NAME;

// Initialize Sequelize
const sequelize = new Sequelize(database, user, password, {
  host: host,
  dialect: 'mysql'
});

// Define models
const Staff = sequelize.define('Staff', {
    st_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    st_username: DataTypes.STRING,
    st_password: DataTypes.STRING,
    st_name: DataTypes.STRING,
    st_tel: DataTypes.STRING(10),
    st_start: DataTypes.DATE,
    st_end: DataTypes.DATE,
    st_type: DataTypes.STRING(1),
    st_status: DataTypes.STRING(1)
  });
  
  const Unit = sequelize.define('Unit', {
    un_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    un_name: DataTypes.STRING,
    type: DataTypes.STRING(1)
  });
  
  const Ingredient = sequelize.define('Ingredient', {
    ind_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ind_name: DataTypes.STRING,
    qtyminimum: DataTypes.INTEGER,
    qty_per_unit: DataTypes.INTEGER,
    ind_stock: DataTypes.INTEGER,
    un_purchased: DataTypes.INTEGER,
    un_ind: DataTypes.INTEGER,
    status: DataTypes.STRING(1)
  });
  
  const ProductCategory = sequelize.define('productCategory', {
    pdc_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pdc_name: DataTypes.STRING
  }, {
    tableName: 'productCategory',
    timestamps: false
  });
  
  const Product = sequelize.define('Product', {
    pd_id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    pd_name: DataTypes.STRING(255),
    pd_qtyminimum: DataTypes.INTEGER,
    picture: DataTypes.TEXT,
    pdc_id: DataTypes.INTEGER,
    status: DataTypes.STRING(1),
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'products',
    timestamps: false, //
    underscored: true //
  });
  
  const SalesMenuType = sequelize.define('SalesMenuType', {
    smt_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    smt_name: DataTypes.STRING,
    un_id: DataTypes.INTEGER,
    qty_per_unit: DataTypes.INTEGER
  });
  
  const SalesMenu = sequelize.define('SalesMenu', {
    sm_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sm_name: DataTypes.STRING,
    smt_id: DataTypes.INTEGER,
    sm_price: DataTypes.FLOAT,
    status: DataTypes.STRING(1),
    fix: DataTypes.STRING(1),
    picture: DataTypes.TEXT
  });
  
  const Shop = sequelize.define('Shop', {
    sh_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    sh_name: DataTypes.STRING,
    sh_address: DataTypes.STRING,
    sh_tel: DataTypes.STRING(10),
    sh_province: DataTypes.STRING,
    sh_district: DataTypes.STRING,
    sh_ampher: DataTypes.STRING,
    sh_zipcode: DataTypes.STRING
  });
  
  const OrdersType = sequelize.define('OrdersType', {
    odt_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    odt_name: DataTypes.STRING,
    odt_per: DataTypes.FLOAT,
    odt_price: DataTypes.FLOAT
  });
  

  async function seedDatabase() {
    const t = await sequelize.transaction();
  
    try {

      await sequelize.sync({ alter: true, force: false });
  
      // 1. Staff
      const staffCount = await Staff.count({ transaction: t });
      if (staffCount === 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await Staff.create({
          st_username: 'jaemin',
          st_password: hashedPassword,
          st_name: 'Jaemin Na',
          st_tel: '1234567890',
          st_start: '2024-03-15',
          st_type: '0'
        }, { transaction: t });
      }
  
      // 2. Units
      const unitCount = await Unit.count({ transaction: t });
      if (unitCount === 0) {
        const units = [
          { un_name: 'ถุง', type: '1' },
          { un_name: 'แกลลอน', type: '1' },
          { un_name: 'กรัม', type: '1' },
          { un_name: 'กิโลกรัม', type: '1' },
          { un_name: 'ขวด', type: '1' },
          { un_name: 'กระป๋อง', type: '1' },
          { un_name: 'กล่อง', type: '1' },
          { un_name: 'ถ้วย', type: '1' },
          { un_name: 'มิลลิลิตร', type: '1' },
          { un_name: 'ลิตร', type: '1' },
          { un_name: 'ก้อน', type: '1' },
          { un_name: 'กล่อง', type: '2' },
          { un_name: 'ชิ้น', type: '2' },
          { un_name: 'ถ้วย', type: '2' }
        ];
        await Unit.bulkCreate(units, { transaction: t });
      }
  
      // 3. Product Categories (moved up)
      const productCategoryCount = await ProductCategory.count({ transaction: t });
      if (productCategoryCount === 0) {
        const productCategory = [
          { pdc_name: 'โดนัท' },
          { pdc_name: 'ดิปซอส' }
        ];
        await ProductCategory.bulkCreate(productCategory, { transaction: t });
      }
  
      // 4. Ingredients
      const ingredientCount = await Ingredient.count({ transaction: t });
      if (ingredientCount === 0) {
        const ingredients = [
          { ind_name: 'แป้งตราดอกบัว', qtyminimum: 10, qty_per_unit: 250, ind_stock: 300, un_purchased: 1, un_ind: 3, status: '2' },
          { ind_name: 'แป้งอเนกประสงค์', qtyminimum: 10, qty_per_unit: 250, ind_stock: 300, un_purchased: 1, un_ind: 3, status: '2' },
          { ind_name: 'นมสด', qtyminimum: 10, qty_per_unit: 1000, ind_stock: 100, un_purchased: 2, un_ind: 9, status: '2' },
          { ind_name: 'กลิ่นใบเตย', qtyminimum: 5, qty_per_unit: 100, ind_stock: 100, un_purchased: 5, un_ind: 9, status: '2' },
          { ind_name: 'เนย', qtyminimum: 10, qty_per_unit: 100, ind_stock: 100, un_purchased: 11, un_ind: 3, status: '2' },
          { ind_name: 'น้ำมันดอกทานตะวัน', qtyminimum: 10, qty_per_unit: 1000, ind_stock: 100, un_purchased: 2, un_ind: 9, status: '2' }
        ];
        await Ingredient.bulkCreate(ingredients, { transaction: t });
      }
  
      // 5. Products
      const productCount = await Product.count({ transaction: t });
      if (productCount === 0) {
        const products = [
          { pd_name: 'ใบเตย', pd_qtyminimum: 15, picture: '/images/1729190147386_Screenshot 2023-08-18 172917.png', pdc_id: 1, status: 'A' },
          { pd_name: 'ออริจินอล', pd_qtyminimum: 15, picture: '/images/1729190265333_Screenshot 2023-08-18 173051.png', pdc_id: 1, status: 'A' },
          { pd_name: 'ดิปนมฮอกไกโด', pd_qtyminimum: 10, picture: '/images/logo.svg', pdc_id: 2, status: 'A' },
          { pd_name: 'ดิปป้อกกี้', pd_qtyminimum: 10, picture: '/images/logo.svg', pdc_id: 2, status: 'A' },
          { pd_name: 'ดิปช็อก', pd_qtyminimum: 10, picture: '/images/logo.svg', pdc_id: 2, status: 'A' },
          { pd_name: 'ดิปชาไทย', pd_qtyminimum: 10, picture: '/images/logo.svg', pdc_id: 2, status: 'A' }
        ];
        await Product.bulkCreate(products, { transaction: t });
      }
  
      // 6. Sales Menu Types
      const salesMenuTypeCount = await SalesMenuType.count({ transaction: t });
      if (salesMenuTypeCount === 0) {
        const salesMenuTypes = [
          { smt_name: 'กล่อง M', un_id: 12, qty_per_unit: 4 },
          { smt_name: 'กล่อง L', un_id: 12, qty_per_unit: 6 },
          { smt_name: 'ดิปซอส', un_id: 14, qty_per_unit: 1 },
          { smt_name: 'เดี่ยว', un_id: 13, qty_per_unit: 1 }
        ];
        await SalesMenuType.bulkCreate(salesMenuTypes, { transaction: t });
      }
  
      // 7. Sales Menus
      const salesMenuCount = await SalesMenu.count({ transaction: t });
      if (salesMenuCount === 0) {
        const salesMenus = [
          { sm_name: 'ใบเตย กล่อง L', smt_id: 2, sm_price: 100, status: 'c', fix: '1', picture: '/images/1729190414666_366293130_690253539783704_9103270027965469472_n.jpg' },
          { sm_name: 'ออริจินอล', smt_id: 2, sm_price: 100, status: 'c', fix: '1', picture: '/images/1729239280953_366318768_690253679783690_4856585834402605561_n.jpg' },
          { sm_name: 'ดิปนมฮอกไกโด', smt_id: 3, sm_price: 15, status: 'c', fix: '1', picture: '/images/logo.svg' },
          { sm_name: 'ดิปชาไทย', smt_id: 3, sm_price: 15, status: 'c', fix: '1', picture: '/images/logo.svg' },
          { sm_name: 'ดิปป้อกกี้', smt_id: 3, sm_price: 15, status: 'c', fix: '1', picture: 'images/logo.svg' },
          { sm_name: 'ดิปช็อก', smt_id: 3, sm_price: 15, status: 'c', fix: '1', picture: 'images/logo.svg' }
        ];
        await SalesMenu.bulkCreate(salesMenus, { transaction: t });
      }
  
      // 8. Shop
      const shopCount = await Shop.count({ transaction: t });
      if (shopCount === 0) {
        await Shop.create({
          sh_name: 'ชั้น 4  ',
          sh_address: 'เซนทรัลพลาซ่า',
          sh_tel: '0981171779',
          sh_province: '29',
          sh_district: '4101',
          sh_ampher: '410101',
          sh_zipcode: '41000'
        }, { transaction: t });
      }
  
      // 9. Orders Types
      const ordersTypeCount = await OrdersType.count({ transaction: t });
      if (ordersTypeCount === 0) {
        const ordersTypes = [
          { odt_name: 'ขายหน้าร้าน', odt_per: 0, odt_price: 0 },
          { odt_name: 'Line Man', odt_per: 30, odt_price: 0 },
          { odt_name: 'Grab', odt_per: 30, odt_price: 0 }
        ];
        await OrdersType.bulkCreate(ordersTypes, { transaction: t });
      }
  
      await t.commit();
      console.log('Database seeded successfully');
    } catch (error) {
      await t.rollback();
      console.error('Error seeding database:', error);
    } finally {
      await sequelize.close();
    }
  }
  

  seedDatabase();