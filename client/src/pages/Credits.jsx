import { Link } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";

export default function Credits() {
  // Professor Orientador
  const professor = {
    name: "Prof. João Roberto Ursino da Cruz",
    role: "Professor Orientador & Docente",
    subject: "Tecnologia & Desenvolvimento de Sistemas",
    institution: "Itinerário Formativo 2026",
    bio: "Supervisão acadêmica, orientação técnica em boas práticas de engenharia de software e acompanhamento metodológico do projeto."
  };

  // 5 Alunos Desenvolvedores (com P.O. e Scrum Master)
  const teamMembers = [
    {
      name: "Juan Luis",
      role: "Desenvolvedor & Product Owner (P.O.)",
      tag: "Dev • P.O.",
      contributions: "Definição e visão do produto, levantamento e priorização de requisitos, histórias de usuário e desenvolvimento de software.",
      initials: "JL"
    },
    {
      name: "Caio Freire",
      role: "Desenvolvedor & Scrum Master",
      tag: "Dev • Scrum Master",
      contributions: "Facilitação dos ritos ágeis, gestão dos ciclos de entrega, remoção de impedimentos da equipe e desenvolvimento de código.",
      initials: "CF"
    },
    {
      name: "Mario Cesar",
      role: "Desenvolvedor Full Stack",
      tag: "Dev Full Stack",
      contributions: "Arquitetura e integração full stack, sincronização do banco Supabase, deploy serverless na Vercel e regras de negócio da aplicação.",
      initials: "MC"
    },
    {
      name: "Vitor Guilherme",
      role: "Desenvolvedor Full Stack",
      tag: "Dev Full Stack",
      contributions: "Construção de componentes da interface, estilização visual responsiva e integração de dados das comunidades.",
      initials: "VG"
    },
    {
      name: "Manuela Pires",
      role: "Desenvolvedora Full Stack",
      tag: "Dev Full Stack",
      contributions: "Desenvolvimento de páginas e fluxos da aplicação, estruturação das 156 pastorais, testes de usabilidade e interface.",
      initials: "MP"
    }
  ];

  // Tecnologias do Projeto
  const technologies = [
    { name: "React 19 & Vite", category: "Frontend", desc: "Interface rápida, moderna e SPA com navegação fluida." },
    { name: "Node.js & Express", category: "Backend", desc: "API REST segura, controle de taxas e autenticação stateless." },
    { name: "Supabase Cloud", category: "Banco de Dados", desc: "PostgreSQL relacional com Row Level Security em nuvem." },
    { name: "Vercel Platform", category: "Deploy & Cloud", desc: "Hospedagem em nuvem global com funções serverless." }
  ];

  return (
    <>
      <PublicHeader />

      <main className="credits-page">
        {/* Hero da Página de Créditos */}
        <section className="credits-hero">
          <div className="container">
            <Link to="/" className="credits-back-link">← Voltar para o início</Link>
            <div className="credits-hero-content">
              <span className="eyebrow">Projeto Acadêmico & Tecnológico</span>
              <h1>Créditos & Equipe do Projeto</h1>
              <p>
                Conheça os estudantes desenvolvedores e o professor orientador responsáveis pelo planejamento,
                design, desenvolvimento e implantação da plataforma <strong>Minha Paróquia</strong>.
              </p>
            </div>
          </div>
        </section>

        <section className="credits-body container">
          {/* Destaque do Professor Orientador */}
          <div className="credits-section">
            <div className="section-title-wrap">
              <span className="section-tag">Orientação Docente</span>
              <h2>Professor Orientador</h2>
              <p>Supervisão técnica, acadêmica e pedagógica do projeto.</p>
            </div>

            <div className="advisor-card">
              <div className="advisor-avatar-box">
                <svg className="advisor-avatar-svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <div className="advisor-info">
                <span className="advisor-role-badge">{professor.role}</span>
                <h3>{professor.name}</h3>
                <h4 className="advisor-subject">{professor.subject} • {professor.institution}</h4>
                <p className="advisor-bio">{professor.bio}</p>
              </div>
            </div>
          </div>

          {/* Equipe de Alunos / Desenvolvedores */}
          <div className="credits-section">
            <div className="section-title-wrap">
              <span className="section-tag">Desenvolvimento & Execução</span>
              <h2>Equipe de Estudantes</h2>
              <p>5 alunos desenvolvedores com papéis de Product Owner, Scrum Master e Desenvolvimento Full Stack.</p>
            </div>

            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <div key={index} className="team-card">
                  <div className="team-card-header">
                    <div className="member-avatar">
                      {member.initials}
                    </div>
                    <span className="member-tag">{member.tag}</span>
                  </div>
                  <div className="team-card-body">
                    <h3>{member.name}</h3>
                    <strong className="member-role">{member.role}</strong>
                    <p className="member-contributions">{member.contributions}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tecnologias Utilizadas */}
          <div className="credits-section">
            <div className="section-title-wrap">
              <span className="section-tag">Arquitetura de Software</span>
              <h2>Tecnologias Utilizadas</h2>
              <p>Stack moderna empregada na construção da aplicação full stack.</p>
            </div>

            <div className="tech-grid">
              {technologies.map((tech, index) => (
                <div key={index} className="tech-card">
                  <div className="tech-badge">{tech.category}</div>
                  <h4>{tech.name}</h4>
                  <p>{tech.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action para Login de Admin */}
          <div className="credits-admin-cta">
            <div className="admin-cta-copy">
              <span className="eyebrow">Gestão do Sistema</span>
              <h3>Acesso Administrativo</h3>
              <p>É coordenador ou administrador paroquial? Acesse o painel para cadastrar eventos, pastorais e avisos.</p>
            </div>
            <Link to="/admin/login" className="btn btn-primary admin-cta-btn">
              Acessar Painel Admin →
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter context="Projeto acadêmico desenvolvido para conectar comunidades." />
    </>
  );
}
