// Importar módulos necessários
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Carregar variáveis de ambiente

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
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Rota para enviar o email com o arquivo
app.post('/send-email', upload.single('arquivo-email'), (req, res) => {
    const { nome, emails } = req.body;
    if (!nome || !emails || !req.file) {
        return res.status(400).send('Nome, e-mails e arquivo são obrigatórios.');
    }

    const emailList = emails.split(',').map(email => email.trim()); // Transformar a string de e-mails em um array

    // Configurar os detalhes do email
    const mailOptions = {
        from: process.env.EMAIL_USER, // Remetente
        to: emailList, // Lista de e-mails
        subject: `Arquivo de ${nome}`,
        text: `Olá! Segue em anexo o arquivo de ${nome}.`,
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
            console.error('Erro ao enviar email:', error);
            return res.status(500).send('Erro ao enviar email.');
        } else {
            console.log('Email enviado: ' + info.response);

            // Limpar arquivos após envio
            fs.unlink(path.join(__dirname, 'uploads', req.file.filename), (err) => {
                if (err) console.error('Erro ao limpar arquivo:', err);
            });

            res.status(200).send('Email enviado com sucesso!');
        }
    });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
