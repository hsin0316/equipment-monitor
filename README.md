# Document

## Project Overview
The Equipment Monitoring System is a full-stack application designed to simulate the monitoring of semiconductor equipment. It provides real-time data entry, visual chart analysis, anomaly alerts, and Excel export functionality to improve production equipment management efficiency.

## Key Features
- **Input Validation :**

    1. Data Entry

        - Required Field Check : If any field is left empty, the system will display a notification reminding the user to fill it in.
        - Date Restriction : The maximum selectable date is today, preventing users from selecting future dates to ensure data accuracy.
        - Clear Fields : Clicking the "Clear" button instantly resets all input fields for easy re-entry.

        ![](https://i.imgur.com/IM4M52Q.gif)

    2. Date Range Query

        - The start date cannot be later than the end date, and an error message will be displayed if violated.
        - The maximum query range is 14 days to prevent performance issues caused by excessively large data retrieval.

        ![](https://i.imgur.com/zUYm6mk.gif)

- **Data Input & Storage :**

    Simulates the automatic detection process of equipment. Users can manually input key parameters such as time, temperature, pressure, and current, and store them in a database.

     ![](https://i.imgur.com/A5PUYHJ.gif)

- **Real-Time Data & Email Notifications :**

    Once data is entered, the system immediately sends an email notification to the machine operator, simulating daily monitoring updates.

    ![](https://i.imgur.com/a9RAX4r.png)

- **Chart Visualization :**

    The system automatically generates line charts to display temperature, pressure, and current separately. Users can switch between different datasets using buttons, ensuring a clear overview of the equipment's operating status. Additionally, clicking on any data point reveals the exact value.  

- **Data Table Display :**

    Historical data is structured and presented in a table format to provide a more intuitive reference. The combination of charts and tables enables users to quickly grasp operational trends.

    ![](https://imgur.com/3wvHH53.gif)

- **Anomaly Indicator Mechanism :**

    If data exceeds predefined limits, the system:

    1. Marks the abnormal data points in red

    2. Displays anomalies in both the table and email content

    3. Uses a red warning line on the chart for better visibility

    ![](https://i.imgur.com/NQczokW.png)
    ![](https://i.imgur.com/NR5JdOk.png)

- **Excel Export :**

    Historical data can be exported as an Excel file, making it easier for further analysis.

    ![](https://i.imgur.com/4xQCCFr.gif)

## System Flowchart

![](https://i.imgur.com/ULNK30j.png)

## Development Tools & Environment
- Frontend : HTML, CSS, JavaScript

- Backend : Node.js, Express

- Database : MySQL

- Email Service : NodeMailer

## Project Directory Structure

```
    /my_project
    │
    ├── vscode/                                    
    ├── node_modules/            
    ├── index.html               
    ├── style.css                
    ├── app.js                   
    ├── server.js                
    ├── package-lock.json        
    ├── package.json             
    ├── README.md
```

## Future Enhancements

- Enhanced Data Visualization: Introduce additional chart types (e.g., bar charts, pie charts) to provide more diverse visual analytics.

- Predictive Equipment Alerts: Besides real-time anomaly warnings, the system will analyze historical data to predict potential equipment failures in advance.

- AI-Powered Analysis: Utilize machine learning techniques to analyze equipment data, improving prediction accuracy and anomaly detection.