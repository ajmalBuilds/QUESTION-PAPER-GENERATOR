import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";

const ViewData = () => {
  const { dataId } = useParams(); // Get the dataId from the URL
  const [structuredData, setStructuredData] = useState(null);
  const [loading, setLoading] = useState(true); // To handle loading state
  const [error, setError] = useState(null); // To handle any errors

  // Function to process the data into Part A and Part B
  const processParts = (data) => {
    const partA = [];
    const partB = [];
    const partAQuestionCount = {}; // To track the number of questions taken per unit for Part A
    let totalQuestionsInPartB = 0;

    // Part A: 2 questions per unit
    data.forEach((unit) => {
      const unitId = unit.unit; // Identify the unit
      const unitQuestions = unit.questions || []; // Ensure unit has questions
      partAQuestionCount[unitId] = 0; // Initialize count for this unit

      unitQuestions.forEach((question) => {
        if (partAQuestionCount[unitId] < 2) {
          partA.push(question); // Add question to Part A
          partAQuestionCount[unitId] += 1; // Increment count for this unit
        }
      });
    });

    // Part B: 5 questions in total
    const allUnitsQuestions = data.flatMap((unit) => unit.questions || []); // Combine all questions from all units
    const pickedUnits = {}; // To track questions picked per unit in Part B

    allUnitsQuestions.forEach((question) => {
      const unitId = question.unit || "unknown"; // Ensure unitId exists
      if (!pickedUnits[unitId]) pickedUnits[unitId] = 0; // Initialize if not exists

      // Pick questions round-robin style from all units
      if (
        totalQuestionsInPartB < 5 &&
        pickedUnits[unitId] < allUnitsQuestions.length
      ) {
        partB.push(question); // Add question to Part B
        pickedUnits[unitId] += 1; // Increment count for this unit in Part B
        totalQuestionsInPartB++; // Increment total question count for Part B
      }
    });

    return { partA, partB };
  };

  const generatePDF = () => {
    const { partA, partB } = processParts(structuredData);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const textWidth = pageWidth - margin * 2;
  
    // Add title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Generated Questions", margin, 10);
  
    let y = 20;
  
    const addSection = (title, questions) => {
      doc.setFontSize(14);
      doc.text(title, margin, y);
      y += 10;
  
      questions.forEach((q, index) => {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);
  
        // Handle question text
        const questionText = `${index + 1}. ${q.question}`;
        const questionLines = doc.splitTextToSize(questionText, textWidth);
        doc.text(questionLines, margin, y);
        y += questionLines.length * 6;
  
        // Handle Bloom's level
        doc.setFontSize(10);
        doc.setTextColor(100);
        const bloomsLevelText = `Bloom's Level: ${q.bloomsLevel}`;
        doc.text(bloomsLevelText, margin, y);
        y += 6;
  
        // Handle answer text
        doc.setFontSize(12);
        doc.setFont("Helvetica", "italic");
        const answerText = `Answer: ${q.answer}`;
        const answerLines = doc.splitTextToSize(answerText, textWidth);
        doc.text(answerLines, margin, y);
        y += answerLines.length * 6;
  
        // Add extra spacing
        y += 4;
  
        // Check for page overflow
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
      });
    };
  
    // Add Part A
    addSection("Part A:", partA);
  
    // Add Part B
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
    addSection("Part B:", partB);
  
    // Save the PDF
    doc.save("Question_Paper.pdf");
  };
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/view/${dataId}`);

        if (response.ok) {
          const data = await response.json();
          setStructuredData(data.structuredData); // Set the fetched data
        } else {
          setError("Data not found or server error");
        }
      } catch (err) {
        setError("Error fetching data");
      } finally {
        setLoading(false); // Set loading to false after data is fetched or error occurred
      }
    };

    fetchData();
  }, [dataId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  // Process the structured data into Part A and Part B
  const { partA, partB } = processParts(structuredData);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Extracted Data</h1>

      <div className="mt-4">
        <button
          onClick={generatePDF}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Download PDF
        </button>
      </div>

      {/* Part A */}
      <div className="bg-white shadow-md p-6 rounded-lg mb-4">
        <h2 className="text-2xl font-bold mb-3">Part A:</h2>
        <ul className="list-decimal font-normal ml-6">
          {partA.map((q, index) => (
            <li key={index}>
            <strong>{q.question}</strong>
            <br/>
            <span className="text-sm text-gray-600">Bloom's Level: {q.bloomsLevel}</span>
            <br />
            <em>Answer : {q.answer}</em>
          </li>
          ))}
        </ul>
      </div>

      {/* Part B */}
      <div className="bg-white shadow-md p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-3">Part B: </h2>
        <ul className="list-decimal font-normal ml-6">
          {partB.map((q, index) => (
            <li key={index}>
              <strong>{q.question}</strong>
              <br/>
              <span className="text-sm text-gray-600">Bloom's Level: {q.bloomsLevel}</span>
              <br />
              <em>Answer: {q.answer}</em>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ViewData;
