// Hyper Perfect Enhancer
// Traditional prompt enhancement with structured output

export class HyperPerfectEnhancer {
    constructor() {
        this.templates = this.initializeTemplates();
        this.validationRules = this.initializeValidationRules();
    }

    initializeTemplates() {
        return {
            system_role: {
                expert: "You are an expert {domain} specialist with {experience} years of experience.",
                assistant: "You are a helpful AI assistant specialized in {domain}.",
                analyst: "You are a professional analyst with expertise in {domain} and data analysis.",
                creator: "You are a creative professional skilled in {domain} and innovative solutions."
            },

            objective: {
                analytical: "Analyze the provided {subject} and provide comprehensive insights.",
                creative: "Create innovative {subject} that meets the specified requirements.",
                instructional: "Provide clear, step-by-step instructions for {subject}.",
                problem_solving: "Solve the {subject} problem using systematic approaches."
            },

            constraints: {
                length: "Response should be {length_limit} words or less.",
                format: "Format the response as {format}.",
                tone: "Maintain a {tone} tone throughout the response.",
                style: "Follow these style guidelines: {style_guidelines}"
            }
        };
    }

    initializeValidationRules() {
        return {
            required: ['raw_prompt', 'primary_goal', 'audience', 'domain', 'task_type', 'language'],
            optional: ['constraints', 'safety_guardrails', 'data_context', 'tool_context'],
            formats: ['markdown', 'json', 'text', 'html', 'both'],
            languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']
        };
    }

    process(inputs) {
        // Step 1: Validate inputs
        const validation = this.validateInputs(inputs);
        if (validation) {
            return validation; // Return error if validation fails
        }

        // Step 2: Analyze prompt
        const analysis = this.analyzePrompt(inputs);

        // Step 3: Create engineered prompt
        const engineered = this.createEngineeredPrompt(inputs, analysis);

        // Step 4: Generate UI
        const ui = this.generateUI();

        // Step 5: Return complete result
        return {
            engineered_prompt: engineered.engineered_prompt,
            engineered_prompt_json: engineered.engineered_prompt_json,
            ui: ui
        };
    }

    validateInputs(inputs) {
        // Check required fields
        for (const field of this.validationRules.required) {
            if (!inputs[field] || inputs[field].toString().trim() === '') {
                return {
                    error: 'ValidationError',
                    message: `Required field '${field}' is missing or empty`,
                    field: field
                };
            }
        }

        // Validate format
        if (inputs.constraints?.format && !this.validationRules.formats.includes(inputs.constraints.format.toLowerCase())) {
            return {
                error: 'ValidationError',
                message: `Invalid format: ${inputs.constraints.format}. Supported formats: ${this.validationRules.formats.join(', ')}`,
                field: 'constraints.format'
            };
        }

        // Validate language
        if (inputs.language && !this.validationRules.languages.includes(inputs.language.toLowerCase())) {
            return {
                error: 'ValidationError',
                message: `Unsupported language: ${inputs.language}. Supported languages: ${this.validationRules.languages.join(', ')}`,
                field: 'language'
            };
        }

        return null; // No validation errors
    }

    analyzePrompt(inputs) {
        const prompt = inputs.raw_prompt;
        const words = prompt.split(/\s+/);

        return {
            word_count: words.length,
            sentence_count: prompt.split(/[.!?]+/).length,
            complexity_score: this.calculateComplexityScore(prompt),
            technical_terms: this.extractTechnicalTerms(prompt),
            key_entities: this.extractKeyEntities(prompt),
            sentiment: this.analyzeSentiment(prompt),
            readability_score: this.calculateReadabilityScore(prompt),
            context_assumptions: this.extractContextAssumptions(inputs)
        };
    }

    createEngineeredPrompt(inputs, analysis) {
        const sections = {
            system_role: this.generateSystemRole(inputs),
            objective: this.generateObjective(inputs, analysis),
            context_assumptions: analysis.context_assumptions,
            inputs: this.generateInputVariables(inputs),
            constraints: this.generateConstraints(inputs),
            tools: this.generateToolsAccess(inputs),
            workflow: this.generateWorkflow(inputs, analysis),
            output_spec: this.generateOutputSpec(inputs),
            validation: this.generateValidation(inputs),
            evaluation_rubric: this.generateEvaluationRubric(inputs)
        };

        const markdown = this.formatAsMarkdown(sections);
        const json = this.formatAsJSON(sections, inputs);

        return {
            engineered_prompt: markdown,
            engineered_prompt_json: json
        };
    }

    generateSystemRole(inputs) {
        const { domain, audience, task_type } = inputs;

        let roleType = 'assistant';
        if (task_type === 'analyze' || task_type === 'evaluate') roleType = 'analyst';
        if (task_type === 'create' || task_type === 'design') roleType = 'creator';
        if (domain === 'technical' || domain === 'programming') roleType = 'expert';

        const template = this.templates.system_role[roleType];
        return template
            .replace('{domain}', domain || 'general')
            .replace('{experience}', '10+');
    }

    generateObjective(inputs, analysis) {
        const { primary_goal, task_type, domain } = inputs;

        let objectiveType = 'analytical';
        if (task_type === 'create' || task_type === 'write') objectiveType = 'creative';
        if (task_type === 'explain' || task_type === 'teach') objectiveType = 'instructional';
        if (task_type === 'solve' || task_type === 'fix') objectiveType = 'problem_solving';

        const template = this.templates.objective[objectiveType];
        const subject = primary_goal || `${domain} task`;

        return template.replace('{subject}', subject);
    }

    generateInputVariables(inputs) {
        const variables = [];

        if (inputs.raw_prompt) {
            variables.push({
                name: 'user_query',
                type: 'string',
                description: 'The original user prompt or query',
                required: true,
                example: inputs.raw_prompt.substring(0, 50) + '...'
            });
        }

        if (inputs.audience) {
            variables.push({
                name: 'target_audience',
                type: 'string',
                description: 'The intended audience for the response',
                required: false,
                example: inputs.audience
            });
        }

        return variables;
    }

    generateConstraints(inputs) {
        const constraints = [];

        if (inputs.constraints?.length_limit) {
            constraints.push(`Maximum length: ${inputs.constraints.length_limit} words`);
        }

        if (inputs.constraints?.format) {
            constraints.push(`Output format: ${inputs.constraints.format}`);
        }

        if (inputs.constraints?.tone) {
            constraints.push(`Tone: ${inputs.constraints.tone}`);
        }

        if (inputs.constraints?.style_guidelines && inputs.constraints.style_guidelines.length > 0) {
            constraints.push(`Style guidelines: ${inputs.constraints.style_guidelines.join(', ')}`);
        }

        return constraints;
    }

    generateToolsAccess(inputs) {
        const tools = [];

        if (inputs.tool_context?.browsing_allowed) {
            tools.push('Web browsing and research capabilities');
        }

        if (inputs.tool_context?.code_execution_allowed) {
            tools.push('Code execution and testing environment');
        }

        if (inputs.tool_context?.allowed_tools && inputs.tool_context.allowed_tools.length > 0) {
            tools.push(`Additional tools: ${inputs.tool_context.allowed_tools.join(', ')}`);
        }

        return tools;
    }

    generateWorkflow(inputs, analysis) {
        const { task_type, domain } = inputs;
        const steps = [];

        // Analyze task type and create appropriate workflow
        if (task_type === 'analyze') {
            steps.push('1. Break down the query into key components');
            steps.push('2. Gather relevant information and data');
            steps.push('3. Apply analytical frameworks and methodologies');
            steps.push('4. Identify patterns, trends, and insights');
            steps.push('5. Synthesize findings into coherent analysis');
            steps.push('6. Provide actionable recommendations');
        } else if (task_type === 'create') {
            steps.push('1. Understand the creative requirements and constraints');
            steps.push('2. Research existing solutions and best practices');
            steps.push('3. Brainstorm innovative approaches and ideas');
            steps.push('4. Develop detailed implementation plan');
            steps.push('5. Create the core content or solution');
            steps.push('6. Refine and polish the final output');
        } else {
            steps.push('1. Understand the user requirements');
            steps.push('2. Plan the approach and methodology');
            steps.push('3. Execute the main task or process');
            steps.push('4. Review and validate the results');
            steps.push('5. Provide final output and recommendations');
        }

        return steps;
    }

    generateOutputSpec(inputs) {
        const { constraints } = inputs;
        const spec = {
            format: constraints?.format || 'markdown',
            structure: this.determineOutputStructure(inputs),
            sections: this.determineOutputSections(inputs),
            examples: constraints?.format === 'json'
        };

        return spec;
    }

    generateValidation(inputs) {
        const validations = [];

        if (inputs.safety_guardrails?.citation_required) {
            validations.push('All factual claims must include citations');
        }

        if (inputs.safety_guardrails?.confidential) {
            validations.push('Ensure no confidential information is disclosed');
        }

        if (inputs.constraints?.length_limit) {
            validations.push(`Response length must not exceed ${inputs.constraints.length_limit} words`);
        }

        validations.push('Content must be accurate, relevant, and well-structured');
        validations.push('Response should align with specified tone and style guidelines');

        return validations;
    }

    generateEvaluationRubric(inputs) {
        const criteria = [
            {
                criterion: 'Accuracy',
                weight: 25,
                description: 'Information is correct and factual'
            },
            {
                criterion: 'Completeness',
                weight: 20,
                description: 'All aspects of the query are addressed'
            },
            {
                criterion: 'Clarity',
                weight: 20,
                description: 'Response is clear and easy to understand'
            },
            {
                criterion: 'Relevance',
                weight: 15,
                description: 'Content directly addresses the user needs'
            },
            {
                criterion: 'Quality',
                weight: 20,
                description: 'Overall quality and professionalism'
            }
        ];

        return criteria;
    }

    formatAsMarkdown(sections) {
        let markdown = '';

        // System Role
        markdown += `## System Role\n${sections.system_role}\n\n`;

        // Objective
        markdown += `## Objective\n${sections.objective}\n\n`;

        // Context Assumptions
        if (sections.context_assumptions && sections.context_assumptions.length > 0) {
            markdown += `## Context Assumptions\n`;
            sections.context_assumptions.forEach(assumption => {
                markdown += `- ${assumption}\n`;
            });
            markdown += '\n';
        }

        // Input Variables
        if (sections.inputs && sections.inputs.length > 0) {
            markdown += `## Input Variables\n`;
            sections.inputs.forEach(input => {
                markdown += `- **${input.name}** (${input.type}): ${input.description}\n`;
                if (input.example) markdown += `  - Example: ${input.example}\n`;
            });
            markdown += '\n';
        }

        // Constraints
        if (sections.constraints && sections.constraints.length > 0) {
            markdown += `## Constraints\n`;
            sections.constraints.forEach(constraint => {
                markdown += `- ${constraint}\n`;
            });
            markdown += '\n';
        }

        // Tools Access
        if (sections.tools && sections.tools.length > 0) {
            markdown += `## Tools Access\n`;
            sections.tools.forEach(tool => {
                markdown += `- ${tool}\n`;
            });
            markdown += '\n';
        }

        // Workflow
        if (sections.workflow && sections.workflow.length > 0) {
            markdown += `## Workflow\n`;
            sections.workflow.forEach(step => {
                markdown += `${step}\n`;
            });
            markdown += '\n';
        }

        // Output Specification
        markdown += `## Output Specification\n`;
        markdown += `- **Format**: ${sections.output_spec.format}\n`;
        markdown += `- **Structure**: ${sections.output_spec.structure}\n`;
        if (sections.output_spec.sections && sections.output_spec.sections.length > 0) {
            markdown += `- **Sections**: ${sections.output_spec.sections.join(', ')}\n`;
        }
        markdown += '\n';

        // Validation
        if (sections.validation && sections.validation.length > 0) {
            markdown += `## Validation\n`;
            sections.validation.forEach(validation => {
                markdown += `- ${validation}\n`;
            });
            markdown += '\n';
        }

        // Evaluation Rubric
        if (sections.evaluation_rubric && sections.evaluation_rubric.length > 0) {
            markdown += `## Evaluation Rubric\n`;
            sections.evaluation_rubric.forEach(criterion => {
                markdown += `- **${criterion.criterion}** (${criterion.weight}%): ${criterion.description}\n`;
            });
            markdown += '\n';
        }

        return markdown.trim();
    }

    formatAsJSON(sections, inputs) {
        const json = {
            system_role: sections.system_role,
            objective: sections.objective,
            context_assumptions: sections.context_assumptions || [],
            inputs: sections.inputs || [],
            constraints: sections.constraints || [],
            tools: sections.tools || [],
            workflow: sections.workflow || [],
            output_spec: sections.output_spec,
            validation: sections.validation || [],
            evaluation_rubric: sections.evaluation_rubric || [],
            template_string: this.generateTemplateString(sections, inputs)
        };

        return json;
    }

    generateTemplateString(sections, inputs) {
        let template = sections.system_role + '\n\n';
        template += sections.objective + '\n\n';

        if (sections.workflow && sections.workflow.length > 0) {
            template += 'Follow this workflow:\n';
            sections.workflow.forEach((step, index) => {
                template += `${index + 1}. ${step}\n`;
            });
            template += '\n';
        }

        template += 'User Query: {{user_query}}\n\n';
        template += 'Provide your response below:\n';

        return template;
    }

    generateUI() {
        return {
            layout: 'structured',
            sections: ['system_role', 'objective', 'workflow', 'output'],
            styling: {
                theme: 'professional',
                spacing: 'comfortable',
                typography: 'clean'
            }
        };
    }

    // Utility methods
    calculateComplexityScore(prompt) {
        const words = prompt.split(/\s+/);
        const sentences = prompt.split(/[.!?]+/);
        const avgWordsPerSentence = words.length / sentences.length;

        let score = 0;
        score += Math.min(words.length / 100, 1) * 0.3; // Length factor
        score += Math.min(avgWordsPerSentence / 20, 1) * 0.4; // Sentence complexity
        score += Math.min(this.extractTechnicalTerms(prompt).length / 10, 1) * 0.3; // Technical terms

        return Math.round(score * 100);
    }

    extractTechnicalTerms(prompt) {
        const technicalPatterns = [
            /\b[A-Z]{2,}\b/g, // Acronyms
            /\b\w+(?:tion|sion|ment|ness|ity|ism)\b/g, // Technical suffixes
            /\b(?:algorithm|framework|methodology|protocol|architecture|analysis|synthesis)\b/gi
        ];

        const terms = [];
        technicalPatterns.forEach(pattern => {
            const matches = prompt.match(pattern);
            if (matches) terms.push(...matches);
        });

        return [...new Set(terms)]; // Remove duplicates
    }

    extractKeyEntities(prompt) {
        // Simple entity extraction - in production this would use NLP
        const entities = [];
        const capitalized = prompt.match(/\b[A-Z][a-z]+\b/g);
        if (capitalized) entities.push(...capitalized);

        return [...new Set(entities)];
    }

    analyzeSentiment(prompt) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'poor', 'worst'];

        const words = prompt.toLowerCase().split(/\s+/);
        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    calculateReadabilityScore(prompt) {
        const words = prompt.split(/\s+/);
        const sentences = prompt.split(/[.!?]+/);
        const syllables = this.countSyllables(prompt);

        if (sentences.length === 0 || words.length === 0) return 0;

        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = syllables / words.length;

        // Simplified Flesch Reading Ease formula
        const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

        return Math.max(0, Math.min(100, score));
    }

    countSyllables(text) {
        const words = text.toLowerCase().split(/\s+/);
        let syllables = 0;

        words.forEach(word => {
            // Simple syllable counting - counts vowel groups
            const vowelGroups = word.match(/[aeiouy]+/g);
            syllables += vowelGroups ? vowelGroups.length : 1;
        });

        return syllables;
    }

    extractContextAssumptions(inputs) {
        const assumptions = [];

        if (inputs.domain) {
            assumptions.push(`User has basic knowledge of ${inputs.domain}`);
        }

        if (inputs.audience === 'expert') {
            assumptions.push('User has advanced knowledge of the subject matter');
        } else if (inputs.audience === 'beginner') {
            assumptions.push('User is new to the subject matter');
        }

        if (inputs.language !== 'en') {
            assumptions.push(`Response should be in ${inputs.language} language`);
        }

        assumptions.push('User expects accurate, helpful, and well-structured response');

        return assumptions;
    }

    determineOutputStructure(inputs) {
        const { task_type, constraints } = inputs;

        if (constraints?.format === 'json') return 'structured_data';
        if (task_type === 'analyze') return 'analytical_report';
        if (task_type === 'create') return 'creative_output';
        if (task_type === 'explain') return 'educational_content';

        return 'general_response';
    }

    determineOutputSections(inputs) {
        const { task_type } = inputs;
        const sections = [];

        if (task_type === 'analyze') {
            sections.push('Executive Summary', 'Methodology', 'Findings', 'Conclusions', 'Recommendations');
        } else if (task_type === 'create') {
            sections.push('Overview', 'Implementation', 'Features', 'Usage Instructions');
        } else {
            sections.push('Introduction', 'Main Content', 'Summary');
        }

        return sections;
    }
}

export default HyperPerfectEnhancer;