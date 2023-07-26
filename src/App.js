import React, { useState, useRef } from 'react';
import { CSVLink } from "react-csv";
import Papa from 'papaparse';
import XMLParser from 'react-xml-parser';

import './App.css';
const allowedExtensions = ["csv", "xml"];

function App() {
  const inputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);

    const [transactions, setTransactions] = React.useState([]);
    const [failedTransactions, setFailedTransactions] = React.useState([]);

    const headers = [
      { label: "Transaction Reference", key: "reference" },
      { label: "Error Description", key: "description" }
    ];

    const csvReport = {
      data: failedTransactions,
      headers: headers,
      filename: 'customer_transactions_validation_report.csv'
    };

    const parseCSV = (f) => {
      if (!f) return setError("Select a csv or xml file only");
      const reader = new FileReader();
      reader.onload = async ({ target }) => {
          const csv = Papa.parse(target.result, { header: true });
          const parsedData = csv?.data;
          // console.log("CSV Data:", parsedData);
          
          setTransactions(parsedData.map(pd => {
            return {reference: pd["Reference"], accountNumber:pd["Account Number"], description:pd["Description"], startBalance:pd["Start Balance"], mutation: pd["Mutation"], endBalance:pd["End Balance"]}
          }));
      };
      reader.readAsText(f);
    }

    const parseXML = (f) => {
 
      if (!f) return setError("Select a csv or xml file only");

      const reader = new FileReader();
      reader.onload = async ({ target }) => {
        var xml = new XMLParser().parseFromString(target.result);
        let records = xml.children;
        let tempArr = []
        for (let i in records) {
          let obj = {"reference":records[i].attributes.reference};
          for(let j=0 ; j < records[i].children.length; j++){
            obj[records[i].children[j].name] = records[i].children[j].value;
          }
          tempArr.push(obj);
          console.log("obj:", obj);
          }
        setTransactions(tempArr);
      };
      reader.readAsText(f);
    }

    const handleFileChange = (e) => {
      setError(null)
      if (e.target.files.length) {
          const inputFile = e.target.files[0];
          const fileExtension = inputFile?.type.split("/")[1];
          if (!allowedExtensions.includes(fileExtension)) {
              setError("Please select a csv or xml file only.");
              return;
          }
          setFile(inputFile);
          if(fileExtension === "csv"){
            parseCSV(inputFile);
          }else{
            parseXML(inputFile);
          }
      }
  };


    const handleButtonClick = () => {
        inputRef.current?.click();
    };

  const validateTransactions = () => {
    const validTransactions = transactions.reduce((acc, current) => {
      if(current.reference.length > 0){
        const key = current.reference;
        if (acc[key]) { 
          acc[key].push(current);
        } else {
          acc[key] = [current];
        }
      }
      return acc;
    }, {});

    let tempArr = [];

    for(let key in validTransactions){
      if(validTransactions[key].length > 1){
        validTransactions[key].map((tr) => {
          let endBalance = parseFloat(tr.endBalance);
          if(!isNaN(endBalance) && isEndBalanceMatched(tr)){
            tempArr.push({...tr, description: "Duplicate Transaction Reference Found"});
          }else if(isNaN(endBalance)){
            tempArr.push({...tr, description: "Duplicate Transaction Reference Found and End Balance not Correct."});
          }else{
            tempArr.push({...tr, description: "Duplicate Transaction Reference Found and End Balance mismatched with Start Balance and Mutation."});
          }
        });
      }
      else{
        let tr = validTransactions[key][0];
        let endBalance = parseFloat(tr.endBalance);
        if(!isNaN(endBalance) && !isEndBalanceMatched(tr)){
          tempArr.push({...tr, description:"End Balance mismatched with Start Balance and Mutation."});
        }else if(isNaN(endBalance)){
          tempArr.push({...tr, description:"End Balance not Correct."});
        }
      }
    }
    setFailedTransactions(tempArr)
  }

  const isEndBalanceMatched = (tr) => {
    let startBalance = parseFloat(tr.startBalance);
    let mut = Number(tr.mutation);
    let endBalance = parseFloat(startBalance + mut).toFixed(2);
    return(endBalance === parseFloat(tr.endBalance).toFixed(2));
  }

  const backHandler = () => {
    setFile(null);
    setFailedTransactions([]);
    setError("");
  }

    return (
        <div className='main-container'>
          <div className='header'><h1>Assignment</h1></div>
          { failedTransactions.length === 0 &&
          <div className='flex'>
          <div className='file-input-container'>
            <h2>Select Transactions File</h2>
          <input ref={inputRef} className='file-input' type="file" onChange={handleFileChange} />
          <button onClick={handleButtonClick}>Browse</button>
          {file && <span>{file.name}</span>}
          {error && <span style={{"color":"red"}}>{error}</span>}
        </div>
        <button id="validate" onClick={validateTransactions} className='validate' disabled={!file || error != null}>Validate</button>
        </div>
      }
        
        { failedTransactions.length > 0  &&
        <div className='report-table-container'>
        <h2>Failed Records</h2>
        <div className='table-div'>
          <table>
            <tr>
              <th className='th reference'>Transaction Ref.</th>
              <th className='th description'>Error Description</th>
            </tr>
            {failedTransactions.map((d, index) => {
              return(<tr key={index}>
                <td className='reference'>{d.reference}</td>
                <td className='description'>{d.description}</td>
              </tr>)
            })}
          </table>
        </div>
        <div className='button-container'>
        <button onClick={backHandler}>Back</button>
        <CSVLink {...csvReport} className='link'>Export to CSV</CSVLink>
        </div>
        </div>
        }
        </div>
    );
}

export default App;
