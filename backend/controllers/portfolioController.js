import { Portfolio, PortfolioProject, User, PersonalBrand } from '../routes/models/index.js';
import OpenAI from 'openai';
import config from '../config/index.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export const createPortfolio = async (req, res) => {
  try {
    const { title, description, theme, isPublic } = req.body;
    const portfolio = await Portfolio.create({
      candidateId: req.user.id,
      title,
      description,
      theme: theme || 'modern',
      isPublic: isPublic !== false,
      slug: generateSlug(title)
    });
    res.status(201).json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.findAll({
      where: { candidateId: req.user.id },
      include: [{ model: PortfolioProject, as: 'projects', order: [['orderIndex', 'ASC']] }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, portfolios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addProject = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    const project = await PortfolioProject.create({
      portfolioId,
      ...req.body
    });
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generatePersonalBrand = async (req, res) => {
  try {
    const { brandType } = req.body;
    const user = await User.findByPk(req.user.id, { include: ['candidateProfile'] });
    
    const content = await generateBrandContent(user, brandType);
    
    const brand = await PersonalBrand.create({
      candidateId: user.id,
      brandType: brandType || 'linkedin_summary',
      title: `${brandType} - ${user.firstName} ${user.lastName}`,
      content,
      aiGenerated: true,
      aiScore: 85
    });

    res.status(201).json({ success: true, brand });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPersonalBrands = async (req, res) => {
  try {
    const brands = await PersonalBrand.findAll({
      where: { candidateId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

async function generateBrandContent(user, type) {
  const prompt = `Generate ${type} content.
Name: ${user.firstName} ${user.lastName}
${user.candidateProfile?.headline ? `Headline: ${user.candidateProfile.headline}` : ''}
${user.candidateProfile?.summary ? `Summary: ${user.candidateProfile.summary}` : ''}

Return the content as a plain text string.`;

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8
  });

  return response.choices[0].message.content;
}

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
}
