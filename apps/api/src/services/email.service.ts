import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function enviarEmail(options: EmailOptions): Promise<void> {
  if (!process.env.SMTP_USER) {
    console.log("Email desativado (SMTP não configurado)");
    return;
  }

  await transporter.sendMail({
    from: `"AE Gadget" <${process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export function emailConfirmacaoEncomenda(dados: {
  nome: string;
  email: string;
  encomendaId: string;
  itens: { nome: string; quantidade: number; preco: number }[];
  total: number;
  endereco: string;
  metodoPagamento: string;
}): string {
  const itensHtml = dados.itens
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.nome}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantidade}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.preco.toLocaleString("pt-AO")} Kz</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#f97316;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0">AE Gadget</h1>
        <p style="margin:5px 0 0">Confirmação de Encomenda</p>
      </div>
      
      <div style="padding:20px;background:#f9f9f9">
        <p>Olá <strong>${dados.nome}</strong>,</p>
        <p>A sua encomenda <strong>#${dados.encomendaId.slice(-8).toUpperCase()}</strong> foi registada com sucesso!</p>
        
        <table style="width:100%;border-collapse:collapse;margin:20px 0;background:white;border-radius:8px;overflow:hidden">
          <thead>
            <tr style="background:#f97316;color:white">
              <th style="padding:10px;text-align:left">Produto</th>
              <th style="padding:10px;text-align:center">Qtd</th>
              <th style="padding:10px;text-align:right">Preço</th>
            </tr>
          </thead>
          <tbody>${itensHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:10px;font-weight:bold">Total</td>
              <td style="padding:10px;text-align:right;font-weight:bold;color:#f97316">${dados.total.toLocaleString("pt-AO")} Kz</td>
            </tr>
          </tfoot>
        </table>
        
        <p><strong>Endereço de entrega:</strong> ${dados.endereco}</p>
        <p><strong>Método de pagamento:</strong> ${dados.metodoPagamento}</p>
        
        <div style="background:#fff3cd;padding:15px;border-radius:8px;margin:20px 0">
          <p style="margin:0"><strong>Próximos passos:</strong></p>
          <p style="margin:5px 0 0">Vamos preparar a sua encomenda e entraremos em contacto para combinar a entrega.</p>
        </div>
      </div>
      
      <div style="text-align:center;padding:20px;color:#666;font-size:12px">
        <p>Obrigado pela sua preferência!</p>
        <p>AE Gadget — Lubango, Angola</p>
      </div>
    </body>
    </html>
  `;
}

export function emailAtualizacaoEstado(dados: {
  nome: string;
  encomendaId: string;
  estado: string;
  mensagem: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#f97316;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0">AE Gadget</h1>
        <p style="margin:5px 0 0">Atualização da Encomenda</p>
      </div>
      
      <div style="padding:20px;background:#f9f9f9">
        <p>Olá <strong>${dados.nome}</strong>,</p>
        <p>A sua encomenda <strong>#${dados.encomendaId.slice(-8).toUpperCase()}</strong> foi atualizada.</p>
        
        <div style="background:white;padding:15px;border-radius:8px;margin:20px 0;text-align:center">
          <p style="margin:0;color:#666">Estado atual:</p>
          <p style="margin:5px 0;font-size:20px;font-weight:bold;color:#f97316">${dados.estado}</p>
          <p style="margin:0;color:#666">${dados.mensagem}</p>
        </div>
      </div>
      
      <div style="text-align:center;padding:20px;color:#666;font-size:12px">
        <p>AE Gadget — Lubango, Angola</p>
      </div>
    </body>
    </html>
  `;
}
