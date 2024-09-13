const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const app = express();

// Configurar bodyParser para lidar com dados de formulários
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurar armazenamento de arquivos com multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão salvos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Renomear o arquivo para evitar conflitos
    }
});

const upload = multer({ storage: storage });

// Configurar a rota da página principal (formulário)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Configurar o transporte de email
const transporter = nodemailer.createTransport({
    service: 'gmail', // Pode usar outros serviços, como Outlook, Yahoo, etc.
    auth: {
        user: 'seuemail@gmail.com', // Seu email
        pass: 'suasenha' // Sua senha do email (ou app password se tiver autenticação em dois fatores)
    }
});

// Rota para enviar o email com o arquivo
app.post('/send-email', upload.single('arquivo-email'), (req, res) => {
    const { nome, emails } = req.body;
    const emailList = emails.split(',').map(email => email.trim()); // Transformar a string de e-mails em um array

    // Configurar os detalhes do email
    const mailOptions = {
        from: 'seuemail@gmail.com',
        to: emailList, // Lista de e-mails
        subject: `Arquivo de ${nome}`,
        text: `Olá! Segue em anexo o Email de ${nome}.`,
        attachments: [
            {
                filename: req.file.filename, // Nome do arquivo anexado
                path: path.join(__dirname, 'uploads', req.file.filename) // Caminho para o arquivo anexado
            }
        ]
    };

    // Enviar o email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).send('Erro ao enviar email.');
        } else {
            console.log('Email enviado: ' + info.response);
            res.status(200).send('Email enviado com sucesso!');
        }
    });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
