export interface StructuredInterviewQuestion {
  order: number;
  difficultyLevel: number;
  category: string;
  question: string;
  context?: string;
}

export const interviewQuestions: Record<string, StructuredInterviewQuestion[]> = {
  beginner: [
    {
      order: 1,
      difficultyLevel: 1,
      category: "introduction",
      question: "Tell me a little bit about yourself.",
      context: "Start with a short, simple introduction."
    },
    {
      order: 2,
      difficultyLevel: 2,
      category: "education",
      question: "What did you study in school or university?",
      context: "Keep it simple and mention your degree or main subjects."
    },
    {
      order: 3,
      difficultyLevel: 3,
      category: "skills",
      question: "What are some of your main technical or professional skills?",
      context: "List 2-3 key skills you have."
    },
    {
      order: 4,
      difficultyLevel: 4,
      category: "projects",
      question: "Can you tell me about a project you worked on recently?",
      context: "Briefly describe what the project was and what you did."
    },
    {
      order: 5,
      difficultyLevel: 5,
      category: "behavioral",
      question: "What would you say is your greatest strength?",
      context: "Pick one strength and give a short example."
    },
    {
      order: 6,
      difficultyLevel: 6,
      category: "problem solving",
      question: "Tell me about a time you faced a problem and how you solved it.",
      context: "Describe a simple problem and your straightforward solution."
    },
    {
      order: 7,
      difficultyLevel: 7,
      category: "closing",
      question: "Why do you want to work for our company?",
      context: "Express your interest simply and positively."
    }
  ],
  intermediate: [
    {
      order: 1,
      difficultyLevel: 1,
      category: "introduction",
      question: "Please introduce yourself and briefly explain your professional background.",
      context: "Focus on your recent experience and current role."
    },
    {
      order: 2,
      difficultyLevel: 2,
      category: "skills",
      question: "Could you explain your most important technical skill and how you've used it?",
      context: "Provide specific examples of applying this skill in a professional setting."
    },
    {
      order: 3,
      difficultyLevel: 3,
      category: "projects",
      question: "Tell me about a challenging project you worked on. What was your role?",
      context: "Highlight your responsibilities and the challenges faced."
    },
    {
      order: 4,
      difficultyLevel: 4,
      category: "problem solving",
      question: "What was the biggest problem you faced in that project, and how did you overcome it?",
      context: "Focus on the specific steps you took to resolve the issue."
    },
    {
      order: 5,
      difficultyLevel: 5,
      category: "technical decisions",
      question: "How do you make a technical decision when you have multiple viable options?",
      context: "Explain your thought process and what factors you consider (e.g., time, resources)."
    },
    {
      order: 6,
      difficultyLevel: 6,
      category: "behavioral",
      question: "Tell me about a time you had a disagreement within your team. How did you handle it?",
      context: "Show how you communicate and resolve conflicts professionally."
    },
    {
      order: 7,
      difficultyLevel: 7,
      category: "reasoning",
      question: "Why should we choose you over other qualified candidates?",
      context: "Highlight your unique combination of skills and experience."
    },
    {
      order: 8,
      difficultyLevel: 8,
      category: "closing",
      question: "Where do you see yourself professionally in the next three to five years?",
      context: "Show ambition and alignment with a potential career path."
    }
  ],
  advanced: [
    {
      order: 1,
      difficultyLevel: 1,
      category: "introduction",
      question: "Tell me about yourself, focusing on your technical background and key career achievements.",
      context: "Deliver a concise, impactful summary of your career trajectory."
    },
    {
      order: 2,
      difficultyLevel: 2,
      category: "projects",
      question: "Explain one technical project that best demonstrates your strongest engineering or professional abilities.",
      context: "Dive deep into the architecture, your specific contributions, and the impact."
    },
    {
      order: 3,
      difficultyLevel: 3,
      category: "problem solving",
      question: "Describe a difficult technical problem you encountered. Explain how you evaluated the possible solutions before choosing one.",
      context: "Focus on the evaluation criteria and the trade-offs considered."
    },
    {
      order: 4,
      difficultyLevel: 4,
      category: "trade-offs",
      question: "Tell me about a technical decision you made that had significant trade-offs. Why did you make that choice?",
      context: "Show your understanding that no solution is perfect and justify your compromise."
    },
    {
      order: 5,
      difficultyLevel: 5,
      category: "failure analysis",
      question: "Describe a situation where your initial approach to a problem failed completely. What did you learn from it?",
      context: "Demonstrate accountability, resilience, and the ability to pivot."
    },
    {
      order: 6,
      difficultyLevel: 6,
      category: "system design",
      question: "How would you design a scalable solution for a complex problem you have worked on in the past?",
      context: "Discuss architecture, bottlenecks, and scaling strategies."
    },
    {
      order: 7,
      difficultyLevel: 7,
      category: "leadership",
      question: "If your team or stakeholders strongly disagreed with your technical approach, how would you handle the situation?",
      context: "Explain how you use data, empathy, and negotiation to build consensus."
    },
    {
      order: 8,
      difficultyLevel: 8,
      category: "technical judgment",
      question: "Explain how you balance performance, scalability, maintainability, and development time when designing a system.",
      context: "Show your ability to prioritize conflicting requirements based on business needs."
    },
    {
      order: 9,
      difficultyLevel: 9,
      category: "defending decisions",
      question: "Defend a controversial technical decision you made. Explain what alternative you rejected and why.",
      context: "Provide strong, logical arguments for your choice against viable alternatives."
    },
    {
      order: 10,
      difficultyLevel: 10,
      category: "ambiguity",
      question: "Describe a complex problem where there was no obvious correct solution. Explain how you approached it.",
      context: "Demonstrate how you navigate ambiguity, gather information, and make informed choices."
    }
  ]
};
