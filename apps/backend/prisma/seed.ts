import { PrismaClient, OscStatus, ProjectStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Seed password for all test student accounts
const SEED_PASSWORD = 'Seed1234!';

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
    // IN_PROGRESS because it has an active project in the current semester
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
    // IN_PROGRESS: project from 2025-2 still open (pending closure)
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
    // IN_PROGRESS: project created in current semester but no team yet
    status: 'IN_PROGRESS',
  },
  {
    name: 'Instituto Luz da Infância',
    category: 'Educação',
    description:
      'Desenvolve programas de reforço escolar, arte e esporte para crianças de 6 a 14 anos em comunidades sem acesso a atividades extracurriculares.',
    email: 'luz@luzinfancia.org.br',
    phone: '(11) 8901-2345',
    // IN_PROGRESS while project is COMPLETED but OSC status may lag until coordinator acts
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
    // AVAILABLE: project was abandoned so OSC was released
    status: 'AVAILABLE',
  },
];

// Codes must be 6 chars from A-Z + 2-9 (no 0, O, I, 1 to avoid visual ambiguity)
const STUDENT_SEED_DATA: Array<{
  name: string;
  email: string;
  role: UserRole;
}> = [
  { name: 'Ana Silva', email: 'aluno1@seed.dev', role: 'STUDENT' },
  { name: 'Bruno Costa', email: 'aluno2@seed.dev', role: 'STUDENT' },
  { name: 'Carla Mendes', email: 'aluno3@seed.dev', role: 'STUDENT' },
  { name: 'Diego Santos', email: 'aluno4@seed.dev', role: 'STUDENT' },
  { name: 'Eduarda Lima', email: 'aluno5@seed.dev', role: 'STUDENT' },
  { name: 'Felipe Rocha', email: 'aluno6@seed.dev', role: 'STUDENT' },
  { name: 'Gabriela Nunes', email: 'aluno7@seed.dev', role: 'STUDENT' },
  { name: 'Henrique Alves', email: 'aluno8@seed.dev', role: 'STUDENT' },
  { name: 'Isabela Ferreira', email: 'aluno9@seed.dev', role: 'STUDENT' },
  { name: 'João Oliveira', email: 'aluno10@seed.dev', role: 'STUDENT' },
  { name: 'Larissa Pinto', email: 'aluno11@seed.dev', role: 'STUDENT' },
  { name: 'Mateus Barbosa', email: 'aluno12@seed.dev', role: 'STUDENT' },
];

// Projects are described declaratively and linked to OSCs/students by email/name at runtime.
// Current semester is 2026-1.
const PROJECT_SEED_DATA: Array<{
  name: string;
  oscName: string;
  status: ProjectStatus;
  teams: Array<{
    semester: string;
    code: string;
    createdByEmail: string;
    memberEmails: string[];
  }>;
}> = [
  {
    // Semestre atual — IN_PROGRESS (exibe badge azul, sem destaque especial)
    name: 'Conecta Jovem',
    oscName: 'Ação Solidária Brasil',
    status: 'IN_PROGRESS',
    teams: [
      {
        semester: '2026-1',
        code: 'ABCD23',
        createdByEmail: 'aluno1@seed.dev',
        memberEmails: [
          'aluno1@seed.dev',
          'aluno2@seed.dev',
          'aluno3@seed.dev',
          'aluno4@seed.dev',
          'aluno5@seed.dev',
        ],
      },
    ],
  },
  {
    // Semestre atual — COMPLETED (badge verde)
    name: 'Arte na Comunidade',
    oscName: 'Instituto Luz da Infância',
    status: 'COMPLETED',
    teams: [
      {
        semester: '2026-1',
        code: 'EFGH45',
        createdByEmail: 'aluno6@seed.dev',
        memberEmails: [
          'aluno6@seed.dev',
          'aluno7@seed.dev',
          'aluno8@seed.dev',
          'aluno9@seed.dev',
        ],
      },
    ],
  },
  {
    // Semestre atual — sem equipe ainda (teams.length === 0 → currentProjects)
    name: 'Habitar Bem',
    oscName: 'ONG Mãos que Constroem',
    status: 'IN_PROGRESS',
    teams: [],
  },
  {
    // Semestres anteriores — IN_PROGRESS em semestre passado → PENDENTE (amarelo, ícone alerta)
    name: 'Tech Social',
    oscName: 'Casa da Acolhida',
    status: 'IN_PROGRESS',
    teams: [
      {
        semester: '2025-2',
        code: 'JKLM67',
        createdByEmail: 'aluno1@seed.dev',
        memberEmails: [
          'aluno1@seed.dev',
          'aluno3@seed.dev',
          'aluno5@seed.dev',
          'aluno7@seed.dev',
          'aluno9@seed.dev',
          'aluno11@seed.dev',
        ],
      },
    ],
  },
  {
    // Semestres anteriores — ABANDONED (badge vermelho)
    name: 'Alimentar Esperança',
    oscName: 'Instituto Novo Horizonte',
    status: 'ABANDONED',
    teams: [
      {
        semester: '2025-1',
        code: 'NPQR89',
        createdByEmail: 'aluno2@seed.dev',
        memberEmails: [
          'aluno2@seed.dev',
          'aluno4@seed.dev',
          'aluno6@seed.dev',
          'aluno8@seed.dev',
        ],
      },
    ],
  },
  {
    // Semestres anteriores — COMPLETED, múltiplas equipes em semestres distintos
    // Testa o expand/collapse da lista de equipes
    name: 'Raízes Culturais',
    oscName: 'Coletivo Raízes',
    status: 'COMPLETED',
    teams: [
      {
        semester: '2024-2',
        code: 'STUV23',
        createdByEmail: 'aluno10@seed.dev',
        memberEmails: [
          'aluno10@seed.dev',
          'aluno11@seed.dev',
          'aluno12@seed.dev',
          'aluno3@seed.dev',
          'aluno5@seed.dev',
        ],
      },
      {
        semester: '2025-1',
        code: 'WXYZ45',
        createdByEmail: 'aluno4@seed.dev',
        memberEmails: [
          'aluno4@seed.dev',
          'aluno6@seed.dev',
          'aluno8@seed.dev',
          'aluno10@seed.dev',
          'aluno12@seed.dev',
          'aluno2@seed.dev',
        ],
      },
    ],
  },
];

async function seedOscs(): Promise<void> {
  for (const osc of OSC_SEED_DATA) {
    await prisma.osc.upsert({
      where: { name: osc.name },
      update: { description: osc.description, email: osc.email, phone: osc.phone, status: osc.status },
      create: osc,
    });
  }
  console.log(`Upserted ${OSC_SEED_DATA.length} OSCs`);
}

async function seedStudents(): Promise<Map<string, string>> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const emailToId = new Map<string, string>();

  for (const student of STUDENT_SEED_DATA) {
    const user = await prisma.user.upsert({
      where: { email: student.email },
      update: { name: student.name },
      create: { name: student.name, email: student.email, passwordHash, role: student.role },
      select: { id: true, email: true },
    });
    emailToId.set(user.email, user.id);
  }

  console.log(`Upserted ${STUDENT_SEED_DATA.length} student accounts (password: ${SEED_PASSWORD})`);
  return emailToId;
}

async function seedProjects(emailToId: Map<string, string>): Promise<void> {
  for (const spec of PROJECT_SEED_DATA) {
    const osc = await prisma.osc.findUniqueOrThrow({ where: { name: spec.oscName }, select: { id: true } });

    const project = await prisma.project.upsert({
      where: { name: spec.name },
      update: { status: spec.status, oscId: osc.id },
      create: { name: spec.name, oscId: osc.id, status: spec.status },
      select: { id: true },
    });

    for (const teamSpec of spec.teams) {
      const createdById = emailToId.get(teamSpec.createdByEmail);
      if (!createdById) throw new Error(`User not found: ${teamSpec.createdByEmail}`);

      const team = await prisma.team.upsert({
        where: { code: teamSpec.code },
        update: { semester: teamSpec.semester, projectId: project.id, createdBy: createdById },
        create: {
          projectId: project.id,
          semester: teamSpec.semester,
          code: teamSpec.code,
          createdBy: createdById,
        },
        select: { id: true },
      });

      for (const memberEmail of teamSpec.memberEmails) {
        const userId = emailToId.get(memberEmail);
        if (!userId) throw new Error(`User not found: ${memberEmail}`);

        await prisma.teamMember.upsert({
          where: { teamId_userId: { teamId: team.id, userId } },
          update: {},
          create: { teamId: team.id, userId },
        });
      }
    }
  }

  console.log(`Upserted ${PROJECT_SEED_DATA.length} projects with teams and members`);
}

async function main() {
  await seedOscs();
  const emailToId = await seedStudents();
  await seedProjects(emailToId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
