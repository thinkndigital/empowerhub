import type { PersonalizedEmpowermentRecommendationsInput } from "@/ai/flows/personalized-empowerment-recommendations-flow";

export const mockAiInput: PersonalizedEmpowermentRecommendationsInput = {
  beneficiaryId: "B-12345",
  currentProgress: "The beneficiary has completed the 'Introduction to Business' and 'Digital Marketing Basics' modules with high scores. They have shown strong engagement in forum discussions and submitted all assignments on time. Their quiz average is 92%.",
  skills: ["Basic business planning", "Social media marketing", "Customer communication"],
  goals: "I want to start my own online store selling handmade jewelry. My goal is to generate a sustainable monthly income of at least $500 within the first 6 months. I need to learn more about product photography, online payment systems, and how to manage inventory.",
  completedModules: [
    { id: "mod-001", name: "Introduction to Business", category: "Business Fundamentals" },
    { id: "mod-002", name: "Digital Marketing Basics", category: "Marketing" },
  ],
  availableModules: [
    { id: "mod-001", name: "Introduction to Business", description: "Learn the basics of starting a business.", category: "Business Fundamentals", link: "/dashboard/training/mod-001" },
    { id: "mod-002", name: "Digital Marketing Basics", description: "Understand the fundamentals of online marketing.", category: "Marketing", link: "/dashboard/training/mod-002" },
    { id: "mod-003", name: "Advanced Financial Management", description: "Deep dive into financial planning and analysis.", category: "Finance", link: "/dashboard/training/mod-003" },
    { id: "mod-004", name: "Product Photography for E-commerce", description: "Learn how to take stunning product photos with your smartphone.", category: "E-commerce", link: "/dashboard/training/mod-004" },
    { id: "mod-005", name: "E-commerce Platform Mastery (Shopify)", description: "A-Z guide on setting up and running a Shopify store.", category: "E-commerce", link: "/dashboard/training/mod-005" },
    { id: "mod-006", name: "Inventory Management Strategies", description: "Effective techniques for tracking and managing stock.", category: "Operations", link: "/dashboard/training/mod-006" },
  ],
  availableExternalResources: [
    { id: "res-001", name: "Canva for Social Media Graphics", description: "A free tool to create professional-looking social media posts and ads.", url: "https://www.canva.com/", category: "Marketing" },
    { id: "res-002", name: "Stripe for Online Payments", description: "A guide to setting up Stripe to accept payments online.", url: "https://stripe.com/docs", category: "E-commerce" },
    { id: "res-003", name: "HubSpot's Guide to Starting an Online Business", description: "A comprehensive blog post covering all aspects of e-commerce.", url: "https://blog.hubspot.com/sales/how-to-start-online-business", category: "Business Fundamentals" },
  ],
  availableMentorshipTopics: [
    { id: "men-001", name: "Pricing Strategy", description: "Discuss how to price your products competitively and profitably." },
    { id: "men-002", name: "Building a Brand Identity", description: "Explore how to create a memorable brand for your business." },
    { id: "men-003", name: "Navigating Legal Requirements", description: "Get advice on business registration and compliance." },
    { id: "men-004", name: "Time Management for Entrepreneurs", description: "Learn techniques to balance business and personal life." },
  ],
};
