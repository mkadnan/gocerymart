const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grocerymarts').then(async () => {
  const admin = await User.findOne({email: 'admin@test.com'});
  if (admin) {
    console.log('Admin user found:');
    console.log('- Email:', admin.email);
    console.log('- Role:', admin.role);
    console.log('- Full user:', JSON.stringify({
      id: admin._id,
      email: admin.email,
      role: admin.role,
      name: admin.name
    }, null, 2));
  } else {
    console.log('Admin user not found');
  }
  process.exit();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
