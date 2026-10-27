import { Link } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";

export default function Credits() {
  // Dados do Professor Orientador
  const professor = {
    name: "Prof. [Nome do Professor]",
    role: "Professor Orientador & Coordenador do Projeto",
    subject: "Tecnologia, Desenvolvimento de Sistemas & Projeto Integrador",
    institution: "Itinerário Formativo 2026",
    bio: "Supervisão técnica, pedagógica e orientação metodológica para o desenvolvimento de soluções digitais voltadas à integração e organização comunitária."
  };

  // Dados da Equipe / Alunos
  const teamMembers = [
    {
      name: "Mario [Sobrenome]",
      role: "Desenvolvedor Full Stack & Líder Técnico",
      tag: "Full Stack",
      contributions: "Arquitetura do sistema, integração React + Node.js, modelagem de dados no Supabase e pipeline de deploy na Vercel.",
      initials: "M"
    },
    {
      name: "[Nome do Aluno 2]",
      role: "Desenvolvedor Frontend & UI/UX",
      tag: "Frontend",
      contributions: "Desenvolvimento da interface responsiva, identidade visual, estilização com CSS moderno e navegação das paróquias.",
      initials: "A2"
    },
    {
      name: "[Nome do Aluno 3]",
      role: "Desenvolvedor Backend & Banco de Dados",
      tag: "Backend & DB",
      contributions: "Estruturação das rotas de API, segurança, sessões stateless, migração SQL e persistência no Supabase Cloud.",
      initials: "A3"
    },
    {
      name: "[Nome do Aluno 4]",
      role: "Documentação, Conteúdo & Testes",
      tag: "QA & Conteúdo",
      contributions: "Levantamento das 12 comunidades e 156 pastorais, testes de usabilidade, documentação técnica e validação de requisitos.",
      initials: "A4"
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
                Conheça os estudantes e o professor orientador responsáveis pelo planejamento,
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
                <span className="advisor-avatar-icon">🎓</span>
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
              <p>Alunos desenvolvedores responsáveis pela concepção, código e entrega da plataforma.</p>
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
