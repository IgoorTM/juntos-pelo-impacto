import { PrismaClient, OscStatus } from '@prisma/client';

const prisma = new PrismaClient();

const OSC_SEED_DATA: Array<{
  name: string;
  category: string;
  description: string;
  email: string;
  phone: string;
  status: OscStatus;
}> = [
  {
    name: 'Instituto Recriar',
    category: 'Educação',
    description:
      'Promove atividades culturais e educacionais para crianças e adolescentes em situação de vulnerabilidade social na periferia de São Paulo.',
    email: 'contato@institutorecriar.org.br',
    phone: '(11) 3456-7890',
    status: 'AVAILABLE',
  },
  {
    name: 'Ação Solidária Brasil',
    category: 'Assistência Social',
    description:
      'Atua na distribuição de cestas básicas, roupas e materiais escolares para famílias de baixa renda em comunidades carentes.',
    email: 'acao@solidariabrasil.org',
    phone: '(11) 2345-6789',
    status: 'IN_PROGRESS',
  },
  {
    name: 'Centro Comunitário Esperança',
    category: 'Capacitação Profissional',
    description:
      'Oferece cursos profissionalizantes gratuitos para jovens de 15 a 29 anos, com foco em tecnologia, gastronomia e artesanato.',
    email: 'centro@esperancacc.org.br',
    phone: '(11) 9876-5432',
    status: 'AVAILABLE',
  },
  {
    name: 'Associação Amigos do Verde',
    category: 'Meio Ambiente',
    description:
      'Desenvolve projetos de educação ambiental em escolas públicas, promovendo a consciência ecológica e o cuidado com o meio ambiente urbano.',
    email: 'verde@amigasdoverde.org',
    phone: '(11) 4567-8901',
    status: 'AVAILABLE',
  },
  {
    name: 'Casa da Acolhida',
    category: 'Direitos Humanos',
    description:
      'Abrigo transitório para mulheres vítimas de violência doméstica, com suporte psicológico, jurídico e reinserção profissional.',
    email: 'casa@casadaacolhida.org.br',
    phone: '(11) 5678-9012',
    status: 'IN_PROGRESS',
  },
  {
    name: 'Fundação Caminhos',
    category: 'Reinserção Social',
    description:
      'Apoia a reinserção social de egressos do sistema prisional por meio de capacitação profissional e acompanhamento psicossocial.',
    email: 'fundacao@caminhos.org',
    phone: '(11) 6789-0123',
    status: 'AVAILABLE',
  },
  {
    name: 'ONG Mãos que Constroem',
    category: 'Habitação',
    description:
      'Realiza reformas habitacionais em moradias precárias de famílias em situação de risco, com mutirões voluntários e doação de materiais.',
    email: 'ong@maosqueconstroem.org.br',
    phone: '(11) 7890-1234',
    status: 'AVAILABLE',
  },
  {
    name: 'Instituto Luz da Infância',
    category: 'Educação',
    description:
      'Desenvolve programas de reforço escolar, arte e esporte para crianças de 6 a 14 anos em comunidades sem acesso a atividades extracurriculares.',
    email: 'luz@luzinfancia.org.br',
    phone: '(11) 8901-2345',
    status: 'IN_PROGRESS',
  },
  {
    name: 'Coletivo Raízes',
    category: 'Cultura',
    description:
      'Fortalece a identidade cultural de comunidades quilombolas e indígenas urbanas por meio de eventos, oficinas e produção audiovisual.',
    email: 'coletivo@raizescultura.org',
    phone: '(11) 9012-3456',
    status: 'AVAILABLE',
  },
  {
    name: 'Projeto Navegar',
    category: 'Inclusão',
    description:
      'Utiliza a vela e o remo como ferramentas terapêuticas para jovens com deficiência física e intelectual, promovendo autonomia e inclusão.',
    email: 'projeto@navegar.org.br',
    phone: '(11) 0123-4567',
    status: 'AVAILABLE',
  },
  {
    name: 'Associação Semear',
    category: 'Segurança Alimentar',
    description:
      'Promove a agricultura urbana em hortas comunitárias, gerando renda e segurança alimentar para famílias de baixa renda.',
    email: 'associacao@semearurbanx.org',
    phone: '(11) 1234-5670',
    status: 'AVAILABLE',
  },
  {
    name: 'Instituto Novo Horizonte',
    category: 'Saúde',
    description:
      'Atende idosos em situação de abandono ou vulnerabilidade, oferecendo convivência, cuidados básicos de saúde e atividades cognitivas.',
    email: 'contato@novohorizonte.org.br',
    phone: '(11) 2345-6701',
    status: 'IN_PROGRESS',
  },
];

async function main() {
  for (const osc of OSC_SEED_DATA) {
    await prisma.osc.upsert({
      where: { name: osc.name },
      update: {
        description: osc.description,
        email: osc.email,
        phone: osc.phone,
        status: osc.status,
      },
      create: osc,
    });
  }
  console.log(`Upserted ${OSC_SEED_DATA.length} OSCs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
