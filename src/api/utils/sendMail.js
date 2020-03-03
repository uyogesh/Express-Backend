const nodemailer = require('nodemailer')
const { verifierEmailUsername,
    verifierEmailPassword } = require('../../config/vars')

exports.sendMail = async (receiver, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            // host: 'smtp.gmail.com',
            // port: 587,
            secure: true, // true for 465, false for other ports
            service:'gmail',
            auth: {
                user: verifierEmailUsername, // generated ethereal user
                pass: verifierEmailPassword // generated ethereal password
            }
        });
        let info = transporter.sendMail({
            from: 'nayaacc01@gmail.com', // sender address
            to: receiver, // list of receivers
            subject: title, // Subject line
            text: body, // plain text body
            // html: '<b>Hello world?</b>' // html body
        }).then((success, error)=>{
            if (error){
                console.log(error)
            } else{
            console.log(success)}
        });
        
        return true
    } catch (error) {
        return error
    }
}
