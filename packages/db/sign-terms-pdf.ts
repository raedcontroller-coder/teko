import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

interface SignerInfo {
  id: string;
  name: string;
  crp?: string | null;
  email: string;
  acceptedAt: string;
}

/**
 * Preenche graficamente os checkboxes do Termo de Consentimento da Teko
 * e adiciona o carimbo digital do psicólogo no rodapé da página de conclusão.
 */
export function generateSignedPdfBuffer(
  lang: 'pt' | 'en',
  signer: SignerInfo
): Buffer {
  const baseFilename = lang === 'en' ? 'termo_consentimento_en.pdf' : 'termo_consentimento_pt.pdf';
  
  // Caminhos prováveis para o PDF original
  const candidatePaths = [
    path.resolve(process.cwd(), `apps/mobile/assets/termos/${baseFilename}`),
    path.resolve(process.cwd(), `../../apps/mobile/assets/termos/${baseFilename}`),
    path.resolve(process.cwd(), `../mobile/assets/termos/${baseFilename}`),
    path.resolve(__dirname, `../../apps/mobile/assets/termos/${baseFilename}`),
    path.resolve(__dirname, `../../../../apps/mobile/assets/termos/${baseFilename}`),
    path.resolve('c:/Users/Eduardo/Desktop/Arquivos PTI/TekoPTI/apps/mobile/assets/termos', baseFilename),
  ];

  let inputPath = candidatePaths.find(p => fs.existsSync(p));
  if (!inputPath) {
    throw new Error(`Arquivo base do termo não encontrado: ${baseFilename}`);
  }

  const rawPdfBuffer = fs.readFileSync(inputPath);
  const pdfString = rawPdfBuffer.toString('latin1');

  // Regex para localizar blocos stream com seus respectivos tamanhos /Length
  const streamRegex = /(\d+\s+0\s+obj[\s\r\n]*<<[\s\S]*?\/Length\s+)(\d+)([\s\S]*?>>[\s\r\n]*stream[\r\n]+)([\s\S]*?)([\r\n]+endstream)/g;

  const newPdfString = pdfString.replace(
    streamRegex,
    (match, prefix, _lenStr, mid, streamContent, suffix) => {
      try {
        const streamBuffer = Buffer.from(streamContent, 'latin1');
        const decomp = zlib.inflateSync(streamBuffer).toString('latin1');

        if (decomp.includes('/F4 9 Tf<01>Tj')) {
          // Preenche todos os quadrados com um checkmark estilizado na cor Deep Emerald (#084D48)
          const filledStream = decomp.replace(
            /(1 0 0 1 56\.25 ([\d\.]+) Tm[\s\r\n]*\/F4 9 Tf<01>Tj[\s\r\n]*ET[\s\r\n]*Q)/g,
            (_m, full, y) => {
              const yNum = parseFloat(y);
              // Vetor do checkmark (V de checagem perfeitamente enquadrado dentro do quadrado 7x7)
              const checkmarkVector = [
                'q 0.031 0.302 0.282 RG 1.5 w 1 J 1 j',
                `${(57.4).toFixed(2)} ${(yNum + 4.0).toFixed(2)} m`,
                `${(59.1).toFixed(2)} ${(yNum + 1.9).toFixed(2)} l`,
                `${(63.1).toFixed(2)} ${(yNum + 7.4).toFixed(2)} l`,
                'S Q\n'
              ].join('\n');

              return full + '\n' + checkmarkVector;
            }
          );

          let finalStream = filledStream;

          // Se for a página de conclusão (onde fica a seção 15/16), carimba a assinatura digital
          if (decomp.includes('seção 15') || decomp.includes('Section 15') || decomp.includes('15. Contato')) {
            const dateStr = new Date(signer.acceptedAt).toLocaleString('pt-BR');
            const cleanName = signer.name.replace(/[()\\]/g, '').toUpperCase();
            const cleanCrp = (signer.crp || 'N/A').replace(/[()\\]/g, '');
            const cleanEmail = signer.email.replace(/[()\\]/g, '');
            const cleanId = signer.id.replace(/[()\\]/g, '');

            const stampVector = [
              'q',
              '0.031 0.302 0.282 RG 1 w',
              '56.25 25 500 28 re S',
              '0.031 0.302 0.282 rg',
              'BT',
              '/F1 7.5 Tf',
              `62 43 Td (DOCUMENTO ASSINADO DIGITALMENTE POR: ${cleanName} - CRP: ${cleanCrp}) Tj`,
              `0 -10 Td (DATA/HORA: ${dateStr} | E-MAIL: ${cleanEmail} | ID: ${cleanId}) Tj`,
              'ET',
              'Q\n'
            ].join('\n');

            finalStream = finalStream + '\n' + stampVector;
          }

          const recompressed = zlib.deflateSync(Buffer.from(finalStream, 'latin1'));
          return prefix + recompressed.length + mid + recompressed.toString('latin1') + suffix;
        }
      } catch {
        // Stream não comprimido ou não relacionado
      }
      return match;
    }
  );

  return Buffer.from(newPdfString, 'latin1');
}
