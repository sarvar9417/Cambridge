// ========== GEMINI AI GRADING ==========
const GEMINI_API_KEY = "AIzaSyAR-8wN3iSpN0NGoCsPScUyNkllCfV62rQ";

async function aiGradeAnswer(studentAnswer, correctAnswer, maxScore, questionText) {
    if (!studentAnswer || studentAnswer.trim() === "") return 0;
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        return fallbackGrade(studentAnswer, correctAnswer, maxScore, questionText);
    }
    
    try {
        const prompt = `You are an Edexcel IGCSE and Cambridge AS/A Level examiner. Grade the student's answer.

Question: "${questionText}"
Mark Scheme: "${correctAnswer}"
Student: "${studentAnswer}"
Max score: ${maxScore}

Rules:
- If question asks "State two", student needs TWO correct answers.
- Accept synonyms.
- Output ONLY the score (0-${maxScore}) as a number.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 10 }
            })
        });
        
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        const score = parseInt(result);
        if (!isNaN(score) && score >= 0 && score <= maxScore) return score;
        return fallbackGrade(studentAnswer, correctAnswer, maxScore, questionText);
    } catch(e) {
        console.error("AI error:", e);
        return fallbackGrade(studentAnswer, correctAnswer, maxScore, questionText);
    }
}

function fallbackGrade(studentAnswer, correctAnswer, maxScore, questionText) {
    const student = studentAnswer.toLowerCase();
    const correct = correctAnswer.toLowerCase();
    const required = (questionText.includes("state two") || questionText.includes("give two")) ? 2 :
                     (questionText.includes("state three")) ? 3 : maxScore;
    
    let correctOptions = correct.split(/[\/,]/).map(s => s.trim());
    let studentItems = student.split(/[,;]/).map(s => s.trim());
    let matchCount = 0;
    
    for (let item of studentItems) {
        if (correctOptions.some(opt => opt.includes(item) || item.includes(opt))) {
            matchCount++;
        }
    }
    
    let score = Math.min(maxScore, Math.floor((matchCount / required) * maxScore));
    return score;
}