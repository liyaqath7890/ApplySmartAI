import models from './routes/models/index.js';

const { sequelize } = models;

const runTest = async () => {
  console.log('🚀 Testing sequelize.sync()...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connection authenticated successfully!');
    
    await sequelize.sync({ alter: true });
    console.log('✅ All tables synchronized and altered successfully!');
    
    console.log('🎉 Test passed!');
    
  } catch (error) {
    console.error('❌ Error during test:');
    console.error(error);
  } finally {
    await sequelize.close();
  }
};

runTest();
