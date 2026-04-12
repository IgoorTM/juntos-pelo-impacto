import React, { useState } from "react";

const menuItems = [
    "Dashboard",
    "OSCs",
    "Equipes",
    "Projeto",
    "Seleção de OSC",
    "Formulários",
    "Projeto não concluído",
    "Relatórios",
    "Meu Projeto",
];

function Card({ children, className = "" }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 ${className}`}>
            {children}
        </div>
    );
}

function Badge({ children, tone = "slate" }) {
    const tones = {
        green: "bg-green-100 text-green-700",
        yellow: "bg-yellow-100 text-yellow-700",
        red: "bg-red-100 text-red-700",
        blue: "bg-blue-100 text-blue-700",
        slate: "bg-slate-100 text-slate-700",
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tones[tone] || tones.slate}`}>
            {children}
        </span>
    );
}

function SectionTitle({ title, subtitle }) {
    return (
        <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
        </div>
    );
}

function LoginScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
            <Card className="w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Projeto Juntos pelo Impacto</h1>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none" placeholder="seuemail@exemplo.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                        <input type="password" className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none" placeholder="••••••••" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Perfil</p>
                        <div className="space-y-2 text-slate-700">
                            <label className="flex items-center gap-2"><input type="radio" name="perfil" defaultChecked /> Aluno</label>
                            <label className="flex items-center gap-2"><input type="radio" name="perfil" /> Professor</label>
                            <label className="flex items-center gap-2"><input type="radio" name="perfil" /> OSC</label>
                        </div>
                    </div>
                    <button className="w-full bg-slate-800 text-white rounded-xl py-3 font-medium hover:bg-slate-900 transition">Entrar</button>
                </div>
            </Card>
        </div>
    );
}

function DashboardScreen() {
    const stats = [
        ["12", "OSCs participantes"],
        ["8", "Projetos ativos"],
        ["4", "Pendências"],
        ["2", "Não concluídos"],
    ];

    return (
        <div>
            <SectionTitle title="Dashboard" subtitle="Visão geral do semestre 2026.1" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {stats.map(([n, t]) => (
                    <Card key={t}>
                        <p className="text-3xl font-bold text-slate-800">{n}</p>
                        <p className="text-slate-500 mt-1">{t}</p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-1">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Alertas importantes</h2>
                    <ul className="space-y-3 text-slate-700">
                        <li>⚠️ Projeto “Sistema de Doações” sem reunião confirmada</li>
                        <li>⚠️ OSC “Instituto Vida” com projeto não finalizado</li>
                        <li>⚠️ 3 formulários pendentes de resposta</li>
                    </ul>
                </Card>

                <Card className="xl:col-span-2 overflow-x-auto">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Projetos em andamento</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-500 border-b">
                                <th className="pb-3">Projeto</th>
                                <th className="pb-3">OSC</th>
                                <th className="pb-3">Etapa</th>
                                <th className="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            <tr className="border-b">
                                <td className="py-3">Controle de Estoque</td>
                                <td>OSC Esperança</td>
                                <td>Solução definida</td>
                                <td><Badge tone="yellow">Em andamento</Badge></td>
                            </tr>
                            <tr className="border-b">
                                <td className="py-3">Sistema de Doações</td>
                                <td>Instituto Vida</td>
                                <td>Reunião pendente</td>
                                <td><Badge tone="red">Atenção</Badge></td>
                            </tr>
                            <tr>
                                <td className="py-3">App Educacional</td>
                                <td>ONG Saber</td>
                                <td>Desenvolvimento</td>
                                <td><Badge tone="green">Saudável</Badge></td>
                            </tr>
                        </tbody>
                    </table>
                </Card>
            </div>
        </div>
    );
}

function OSCsScreen() {
    const oscs = [
        { nome: "Instituto Esperança", area: "Educação", status: "Disponível", tone: "green", extra: "Responsável: Maria Silva" },
        { nome: "ONG Saber", area: "Inclusão Digital", status: "Em andamento", tone: "blue", extra: "Equipe: Equipe 03" },
        { nome: "Instituto Vida", area: "Saúde", status: "Bloqueada", tone: "red", extra: "Motivo: Projeto não finalizado" },
    ];

    return (
        <div>
            <SectionTitle title="OSCs" subtitle="Gerencie as organizações participantes" />
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input className="border border-slate-300 rounded-xl px-4 py-3" placeholder="Buscar OSC..." />
                    <select className="border border-slate-300 rounded-xl px-4 py-3"><option>Status</option></select>
                    <select className="border border-slate-300 rounded-xl px-4 py-3"><option>Semestre</option></select>
                    <button className="bg-slate-800 text-white rounded-xl px-4 py-3">+ Nova OSC</button>
                </div>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {oscs.map((osc) => (
                    <Card key={osc.nome}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{osc.nome}</h3>
                                <p className="text-slate-500">Área: {osc.area}</p>
                                <p className="text-slate-600 mt-2">{osc.extra}</p>
                            </div>
                            <Badge tone={osc.tone}>{osc.status}</Badge>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button className="px-4 py-2 rounded-xl bg-slate-800 text-white">Selecionar</button>
                            <button className="px-4 py-2 rounded-xl border border-slate-300">Ver detalhes</button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function EquipesScreen() {
    const equipes = [
        { nome: "Equipe 01", alunos: "João, Ana, Pedro", osc: "Instituto Esperança", status: "Em andamento", tone: "yellow" },
        { nome: "Equipe 02", alunos: "Carla, Lucas", osc: "ONG Saber", status: "Concluído", tone: "green" },
    ];

    return (
        <div>
            <SectionTitle title="Equipes" subtitle="Visualize alunos e vínculos com as OSCs" />
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input className="border border-slate-300 rounded-xl px-4 py-3" placeholder="Buscar equipe..." />
                    <button className="bg-slate-800 text-white rounded-xl px-4 py-3">+ Nova equipe</button>
                </div>
            </Card>
            <div className="space-y-4">
                {equipes.map((e) => (
                    <Card key={e.nome}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{e.nome}</h3>
                                <p className="text-slate-600">Alunos: {e.alunos}</p>
                                <p className="text-slate-600">OSC: {e.osc}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge tone={e.tone}>{e.status}</Badge>
                                <button className="px-4 py-2 rounded-xl border border-slate-300">Ver projeto</button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function ProjetoScreen() {
    const etapas = [
        ["Participação confirmada", true],
        ["Primeira reunião realizada", true],
        ["Solução definida", true],
        ["Desenvolvimento em andamento", "current"],
        ["Acompanhamento final", false],
        ["Encerramento", false],
        ["Avaliação final", false],
    ];

    return (
        <div>
            <SectionTitle title="Projeto: Sistema de Doações" subtitle="OSC: Instituto Esperança • Equipe: Equipe 01" />
            <div className="mb-6"><Badge tone="yellow">Em andamento</Badge></div>
            <Card className="mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Etapas do projeto</h2>
                <div className="space-y-3">
                    {etapas.map(([nome, status]) => (
                        <div key={nome} className="flex items-center gap-3 text-slate-700">
                            <span className="text-xl">
                                {status === true ? "✔️" : status === "current" ? "⏳" : "⚪"}
                            </span>
                            <span>{nome}</span>
                        </div>
                    ))}
                </div>
            </Card>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Ações</h2>
                    <div className="flex flex-wrap gap-3">
                        <button className="px-4 py-2 rounded-xl bg-slate-800 text-white">Registrar andamento</button>
                        <button className="px-4 py-2 rounded-xl border border-slate-300">Anexar arquivo</button>
                        <button className="px-4 py-2 rounded-xl border border-slate-300">Ver histórico</button>
                    </div>
                </Card>
                <Card>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Descrição do projeto</h2>
                    <p className="text-slate-600">Sistema para controle de doações e cadastro de beneficiários.</p>
                </Card>
            </div>
            <Card className="mt-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Histórico</h2>
                <ul className="space-y-2 text-slate-700">
                    <li>10/03 - Reunião realizada</li>
                    <li>20/03 - Solução definida</li>
                    <li>02/04 - Início do desenvolvimento</li>
                </ul>
            </Card>
        </div>
    );
}

function SelecaoOSC() {
    return (
        <div>
            <SectionTitle title="Escolher OSC" subtitle="Selecione uma organização disponível para o projeto" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800">Instituto Esperança</h3>
                    <p className="text-slate-500">Área: Educação</p>
                    <p className="text-slate-600 mt-3">Apoio a crianças em vulnerabilidade.</p>
                    <button className="mt-4 w-full bg-slate-800 text-white rounded-xl py-3">Selecionar</button>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800">ONG Saber</h3>
                    <p className="text-slate-500">Área: Inclusão Digital</p>
                    <p className="text-slate-600 mt-3">Cursos de tecnologia e cidadania digital.</p>
                    <button className="mt-4 w-full bg-slate-800 text-white rounded-xl py-3">Selecionar</button>
                </Card>
                <Card>
                    <div className="flex justify-between items-start gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">Instituto Vida</h3>
                            <p className="text-slate-500">Área: Saúde</p>
                        </div>
                        <Badge tone="red">Indisponível</Badge>
                    </div>
                    <p className="text-slate-600 mt-3">Projeto anterior não finalizado.</p>
                    <button className="mt-4 w-full bg-slate-200 text-slate-500 rounded-xl py-3 cursor-not-allowed">Indisponível</button>
                </Card>
            </div>
        </div>
    );
}

function FormulariosScreen() {
    const items = [
        ["Confirmação de participação", "05/03", "Pendente", "red"],
        ["Primeira reunião realizada", "10/03", "Respondido", "green"],
        ["Avaliação final", "25/06", "Pendente", "yellow"],
        ["Avaliação da experiência do aluno", "25/06", "Pendente", "yellow"],
    ];

    return (
        <div>
            <SectionTitle title="Formulários" subtitle="Acompanhe respostas de OSCs e alunos" />
            <div className="space-y-4">
                {items.map(([titulo, prazo, status, tone]) => (
                    <Card key={titulo}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">{titulo}</h3>
                                <p className="text-slate-500">Prazo/Data: {prazo}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge tone={tone}>{status}</Badge>
                                <button className="px-4 py-2 rounded-xl border border-slate-300">Abrir</button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function ProjetoNaoConcluidoScreen() {
    return (
        <div>
            <SectionTitle title="Projeto não concluído" subtitle="Registro de continuidade para o próximo semestre" />
            <Card className="max-w-3xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
                        <textarea className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-[110px]" placeholder="Descreva por que o projeto não foi finalizado..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Percentual de conclusão</label>
                        <input className="w-full border border-slate-300 rounded-xl px-4 py-3" placeholder="70%" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plano para continuação</label>
                        <textarea className="w-full border border-slate-300 rounded-xl px-4 py-3 min-h-[110px]" placeholder="Explique como o projeto será continuado..." />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Compromete-se a continuar no próximo semestre?</p>
                        <div className="flex gap-4 text-slate-700">
                            <label className="flex items-center gap-2"><input type="radio" name="cont" defaultChecked /> Sim</label>
                            <label className="flex items-center gap-2"><input type="radio" name="cont" /> Não</label>
                        </div>
                    </div>
                    <button className="bg-slate-800 text-white rounded-xl px-5 py-3">Confirmar</button>
                </div>
            </Card>
        </div>
    );
}

function RelatoriosScreen() {
    return (
        <div>
            <SectionTitle title="Relatórios" subtitle="Visualize indicadores e exporte dados" />
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select className="border border-slate-300 rounded-xl px-4 py-3"><option>Filtrar por semestre</option></select>
                    <select className="border border-slate-300 rounded-xl px-4 py-3"><option>Filtrar por OSC</option></select>
                    <select className="border border-slate-300 rounded-xl px-4 py-3"><option>Filtrar por status</option></select>
                </div>
            </Card>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card>
                    <p className="text-3xl font-bold text-slate-800">8</p>
                    <p className="text-slate-500">Projetos concluídos</p>
                </Card>
                <Card>
                    <p className="text-3xl font-bold text-slate-800">2</p>
                    <p className="text-slate-500">Projetos não concluídos</p>
                </Card>
                <Card>
                    <p className="text-3xl font-bold text-slate-800">12</p>
                    <p className="text-slate-500">OSCs participantes</p>
                </Card>
            </div>
            <Card className="mt-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Exportação</h2>
                <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-xl bg-slate-800 text-white">Exportar PDF</button>
                    <button className="px-4 py-2 rounded-xl border border-slate-300">Exportar Excel</button>
                </div>
            </Card>
        </div>
    );
}

function MeuProjetoScreen() {
    return (
        <div>
            <SectionTitle title="Meu Projeto" subtitle="Visão simplificada para o aluno" />
            <Card className="max-w-3xl">
                <div className="space-y-4 text-slate-700">
                    <p><strong>OSC:</strong> Instituto Esperança</p>
                    <p><strong>Equipe:</strong> Equipe 01</p>
                    <div><Badge tone="yellow">Em andamento</Badge></div>
                    <p><strong>Etapa atual:</strong> Desenvolvimento</p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <button className="px-4 py-2 rounded-xl bg-slate-800 text-white">Registrar progresso</button>
                        <button className="px-4 py-2 rounded-xl border border-slate-300">Responder formulário</button>
                        <button className="px-4 py-2 rounded-xl border border-slate-300">Ver histórico</button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function AppLayout() {
    const [screen, setScreen] = useState("Dashboard");

    const renderScreen = () => {
        switch (screen) {
            case "Dashboard":
                return <DashboardScreen />;
            case "OSCs":
                return <OSCsScreen />;
            case "Equipes":
                return <EquipesScreen />;
            case "Projeto":
                return <ProjetoScreen />;
            case "Seleção de OSC":
                return <SelecaoOSC />;
            case "Formulários":
                return <FormulariosScreen />;
            case "Projeto não concluído":
                return <ProjetoNaoConcluidoScreen />;
            case "Relatórios":
                return <RelatoriosScreen />;
            case "Meu Projeto":
                return <MeuProjetoScreen />;
            default:
                return <DashboardScreen />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800">
            <div className="flex flex-col lg:flex-row min-h-screen">
                <aside className="w-full lg:w-72 bg-slate-900 text-white p-5">
                    <div className="mb-6">
                        <h1 className="text-xl font-bold">Juntos pelo Impacto</h1>
                        <p className="text-slate-300 text-sm mt-1">Protótipo de telas</p>
                    </div>
                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <button
                                key={item}
                                onClick={() => setScreen(item)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition ${screen === item ? "bg-white text-slate-900" : "hover:bg-slate-800 text-slate-200"}`}
                            >
                                {item}
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 p-6 lg:p-8">
                    <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
                        <div>
                            <p className="font-semibold">Semestre 2026.1</p>
                            <p className="text-sm text-slate-500">Professor Coordenador</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 rounded-xl border border-slate-300">Notificações</button>
                            <button className="px-4 py-2 rounded-xl bg-slate-800 text-white">Perfil</button>
                        </div>
                    </div>
                    {renderScreen()}
                </main>
            </div>
        </div>
    );
}

export default function App() {
    const [started, setStarted] = useState(false);

    if (!started) {
        return (
            <div className="relative">
                <LoginScreen />
                <button
                    onClick={() => setStarted(true)}
                    className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-lg"
                >
                    Entrar no protótipo
                </button>
            </div>
        );
    }

    return <AppLayout />;
}
