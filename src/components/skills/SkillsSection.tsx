"use client";

import FlowingMenu, { type FlowingMenuItem } from "./FlowingMenu";

export const SKILL_ITEMS: FlowingMenuItem[] = [
  {
    text: "Programming",
    images: [
      "/images/skills/programming/python.webp",
      "/images/skills/programming/typescript.webp",
      "/images/skills/programming/javascript.webp",
      "/images/skills/programming/cpp.webp",
      "/images/skills/programming/java.webp",
      "/images/skills/programming/sql.webp",
    ],
  },
  {
    text: "Machine Learning",
    images: [
      "/images/skills/machinelearning/pytorch.webp",
      "/images/skills/machinelearning/tensorflow.webp",
      "/images/skills/machinelearning/scikitlearn.webp",
      "/images/skills/machinelearning/numpy.webp",
      "/images/skills/machinelearning/pandas.webp",
      "/images/skills/machinelearning/matplotlib.webp",
      "/images/skills/machinelearning/seaborn.webp",
      "/images/skills/machinelearning/xgboost.webp",
      "/images/skills/machinelearning/mlflow.webp",
    ],
  },
  {
    text: "Generative AI",
    images: [
      "/images/skills/generativeai/openai.webp",
      "/images/skills/generativeai/groq.webp",
      "/images/skills/generativeai/langchain.webp",
      "/images/skills/generativeai/ollama.webp",
      "/images/skills/generativeai/huggingface.webp",
    ],
  },
  {
    text: "Web & Backend",
    images: [
      "/images/skills/webbackend/react.webp",
      "/images/skills/webbackend/nextjs.webp",
      "/images/skills/webbackend/nodejs.webp",
      "/images/skills/webbackend/fastapi.webp",
      "/images/skills/webbackend/flask.webp",
      "/images/skills/webbackend/tailwindcss.webp",
      "/images/skills/webbackend/framermotion.webp",
      "/images/skills/webbackend/vite.webp",
      "/images/skills/webbackend/html.webp",
      "/images/skills/webbackend/css.webp",
      "/images/skills/webbackend/shopify.webp",
    ],
  },
  {
    text: "Data & Databases",
    images: [
      "/images/skills/database/postgresql.webp",
      "/images/skills/database/mongodb.webp",
      "/images/skills/database/mysql.webp",
      "/images/skills/database/redis.webp",
      "/images/skills/database/qdrant.webp",
      "/images/skills/database/supabase.webp",
    ],
  },
  {
    text: "UI/UX Design",
    images: [
      "/images/skills/uiux/figma.webp",
      "/images/skills/uiux/framer.webp",
      "/images/skills/uiux/photoshop.webp",
      "/images/skills/uiux/canva.webp",
    ],
  },
  {
    text: "Engineering & DevOps",
    images: [
      "/images/skills/engineeringanddevops/docker.webp",
      "/images/skills/engineeringanddevops/aws.webp",
      "/images/skills/engineeringanddevops/git.webp",
      "/images/skills/engineeringanddevops/github.webp",
      "/images/skills/engineeringanddevops/githubactions.webp",
      "/images/skills/engineeringanddevops/cloudflare.webp",
      "/images/skills/engineeringanddevops/vercel.webp",
      "/images/skills/engineeringanddevops/apachekafka.webp",
      "/images/skills/engineeringanddevops/apachespark.webp",
      "/images/skills/engineeringanddevops/vscode.webp",
    ],
  },
];

export function SkillsSection() {
  return (
    <section id="skills" className="mb-16">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
          Toolbox
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--text-primary)] mt-1">
          Skills
        </h2>
      </div>

      <div
        className="rounded-[2rem] overflow-hidden border border-[color:var(--border)]"
        style={{ height: "clamp(560px, 85vh, 820px)", position: "relative" }}
      >
        <FlowingMenu
          items={SKILL_ITEMS}
          speed={60}
          stretch={0.6}
          magnet={0.25}
          followCursor={0.4}
          direction="left"
          duration={0.5}
          bandInset={0}
          bandRadius={0}
          carryContent={false}
          dividers
          dimInactive={false}
          align="center"
          showIndex={false}
          showArrow={false}
          imageShape="pill"
          imageLayout="group"
          intro
          ariaLabel="Skills"
          textColor="var(--text-primary)"
          bgColor="var(--background)"
          marqueeBgColor="var(--text-primary)"
          marqueeTextColor="var(--background)"
          borderColor="var(--border)"
        />
      </div>
    </section>
  );
}

export default SkillsSection;
