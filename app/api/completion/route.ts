import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { prompt, option = 'corrigir' } = await req.json();

  const systemInstructions: Record<string, string> = {
    corrigir: 'Você é um revisor profissional. Corrija apenas os erros gramaticais e de ortografia do texto a seguir. Retorne EXATAMENTE o texto corrigido, sem adicionar introduções ou aspas.',
    formal: 'Reescreva o texto a seguir deixando-o com um tom formal e profissional, ideal para e-mails e comunicações corporativas.',
    operacional: 'Atue como um analista. Formate o texto a seguir como um relatório operacional claro, objetivo e padronizado, ideal para despachos, registro de ocorrências de turno e logs de sistema. Remova coloquialismos.',
    academico: 'Reescreva o texto a seguir com vocabulário acadêmico e tom impessoal, ideal para trabalhos universitários, resenhas e projetos de extensão.',
    expandir: 'Expanda o texto a seguir adicionando detalhes e contexto relevantes para deixá-lo mais rico, mantendo o sentido original.',
    resumir: 'Crie um resumo conciso e direto do texto a seguir, removendo redundâncias e mantendo os pontos principais.'
  };

  const selectedInstruction = systemInstructions[option] || systemInstructions.corrigir;

  try {
    const result = await streamText({
      model: google('gemini-3.5-flash-lite'), 
      system: selectedInstruction,
      prompt: prompt,
    });
    
    // Devolve o fluxo de dados em formato de Texto Puro (Plain Text)
    return result.toTextStreamResponse();

  } catch (error) {
    console.error("Erro interno ao se comunicar com a API do Google:", error);
    return new Response("Ocorreu um erro ao processar o texto com a Inteligência Artificial.", { status: 500 });
  }
}