var nodemailer = require('nodemailer');

module.exports = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'gogoangi24@gmail.com',
      pass: 'gmail782001'
    }
});


  