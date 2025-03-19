
const lifeExpectancyTable = [
    {
        "Age Range": "0-1",
        "Expectation of life at age x": 76.2
    },
    {
        "Age Range": "1-2",
        "Expectation of life at age x": 75.7
    },
    {
        "Age Range": "2-3",
        "Expectation of life at age x": 74.7
    },
    {
        "Age Range": "3-4",
        "Expectation of life at age x": 73.8
    },
    {
        "Age Range": "4-5",
        "Expectation of life at age x": 72.8
    },
    {
        "Age Range": "5-6",
        "Expectation of life at age x": 71.8
    },
    {
        "Age Range": "6-7",
        "Expectation of life at age x": 70.8
    },
    {
        "Age Range": "7-8",
        "Expectation of life at age x": 69.8
    },
    {
        "Age Range": "8-9",
        "Expectation of life at age x": 68.8
    },
    {
        "Age Range": "9-10",
        "Expectation of life at age x": 67.8
    },
    {
        "Age Range": "10-11",
        "Expectation of life at age x": 66.8
    },
    {
        "Age Range": "11-12",
        "Expectation of life at age x": 65.8
    },
    {
        "Age Range": "12-13",
        "Expectation of life at age x": 64.8
    },
    {
        "Age Range": "13-14",
        "Expectation of life at age x": 63.8
    },
    {
        "Age Range": "14-15",
        "Expectation of life at age x": 62.9
    },
    {
        "Age Range": "15-16",
        "Expectation of life at age x": 61.9
    },
    {
        "Age Range": "16-17",
        "Expectation of life at age x": 60.9
    },
    {
        "Age Range": "17-18",
        "Expectation of life at age x": 59.9
    },
    {
        "Age Range": "18-19",
        "Expectation of life at age x": 59.0
    },
    {
        "Age Range": "19-20",
        "Expectation of life at age x": 58.0
    },
    {
        "Age Range": "20-21",
        "Expectation of life at age x": 57.1
    },
    {
        "Age Range": "21-22",
        "Expectation of life at age x": 56.1
    },
    {
        "Age Range": "22-23",
        "Expectation of life at age x": 55.2
    },
    {
        "Age Range": "23-24",
        "Expectation of life at age x": 54.3
    },
    {
        "Age Range": "24-25",
        "Expectation of life at age x": 53.4
    },
    {
        "Age Range": "25-26",
        "Expectation of life at age x": 52.4
    },
    {
        "Age Range": "26-27",
        "Expectation of life at age x": 51.5
    },
    {
        "Age Range": "27-28",
        "Expectation of life at age x": 50.6
    },
    {
        "Age Range": "28-29",
        "Expectation of life at age x": 49.7
    },
    {
        "Age Range": "29-30",
        "Expectation of life at age x": 48.8
    },
    {
        "Age Range": "30-31",
        "Expectation of life at age x": 47.8
    },
    {
        "Age Range": "31-32",
        "Expectation of life at age x": 46.9
    },
    {
        "Age Range": "32-33",
        "Expectation of life at age x": 46.0
    },
    {
        "Age Range": "33-34",
        "Expectation of life at age x": 45.1
    },
    {
        "Age Range": "34-35",
        "Expectation of life at age x": 44.2
    },
    {
        "Age Range": "35-36",
        "Expectation of life at age x": 43.3
    },
    {
        "Age Range": "36-37",
        "Expectation of life at age x": 42.4
    },
    {
        "Age Range": "37-38",
        "Expectation of life at age x": 41.5
    },
    {
        "Age Range": "38-39",
        "Expectation of life at age x": 40.6
    },
    {
        "Age Range": "39-40",
        "Expectation of life at age x": 39.6
    },
    {
        "Age Range": "40-41",
        "Expectation of life at age x": 38.7
    },
    {
        "Age Range": "41-42",
        "Expectation of life at age x": 37.8
    },
    {
        "Age Range": "42-43",
        "Expectation of life at age x": 36.9
    },
    {
        "Age Range": "43-44",
        "Expectation of life at age x": 36.0
    },
    {
        "Age Range": "44-45",
        "Expectation of life at age x": 35.1
    },
    {
        "Age Range": "45-46",
        "Expectation of life at age x": 34.2
    },
    {
        "Age Range": "46-47",
        "Expectation of life at age x": 33.4
    },
    {
        "Age Range": "47-48",
        "Expectation of life at age x": 32.5
    },
    {
        "Age Range": "48-49",
        "Expectation of life at age x": 31.6
    },
    {
        "Age Range": "49-50",
        "Expectation of life at age x": 30.7
    },
    {
        "Age Range": "50-51",
        "Expectation of life at age x": 29.9
    },
    {
        "Age Range": "51-52",
        "Expectation of life at age x": 29.0
    },
    {
        "Age Range": "52-53",
        "Expectation of life at age x": 28.2
    },
    {
        "Age Range": "53-54",
        "Expectation of life at age x": 27.3
    },
    {
        "Age Range": "54-55",
        "Expectation of life at age x": 26.5
    },
    {
        "Age Range": "55-56",
        "Expectation of life at age x": 25.7
    },
    {
        "Age Range": "56-57",
        "Expectation of life at age x": 24.9
    },
    {
        "Age Range": "57-58",
        "Expectation of life at age x": 24.1
    },
    {
        "Age Range": "58-59",
        "Expectation of life at age x": 23.3
    },
    {
        "Age Range": "59-60",
        "Expectation of life at age x": 22.5
    },
    {
        "Age Range": "60-61",
        "Expectation of life at age x": 21.8
    },
    {
        "Age Range": "61-62",
        "Expectation of life at age x": 21.0
    },
    {
        "Age Range": "62-63",
        "Expectation of life at age x": 20.3
    },
    {
        "Age Range": "64-65",
        "Expectation of life at age x": 19.5
    },
    {
        "Age Range": "65-66",
        "Expectation of life at age x": 18.8
    },
    {
        "Age Range": "66-67",
        "Expectation of life at age x": 18.1
    },
    {
        "Age Range": "67-68",
        "Expectation of life at age x": 17.4
    },
    {
        "Age Range": "68-69",
        "Expectation of life at age x": 16.7
    },
    {
        "Age Range": "69-70",
        "Expectation of life at age x": 16.0
    },
    {
        "Age Range": "70-71",
        "Expectation of life at age x": 15.3
    },
    {
        "Age Range": "71-72",
        "Expectation of life at age x": 14.6
    },
    {
        "Age Range": "72-73",
        "Expectation of life at age x": 13.9
    },
    {
        "Age Range": "73-74",
        "Expectation of life at age x": 13.3
    },
    {
        "Age Range": "74-75",
        "Expectation of life at age x": 12.6
    },
    {
        "Age Range": "75-76",
        "Expectation of life at age x": 12.0
    },
    {
        "Age Range": "76-77",
        "Expectation of life at age x": 11.3
    },
    {
        "Age Range": "77-78",
        "Expectation of life at age x": 10.7
    },
    {
        "Age Range": "78-79",
        "Expectation of life at age x": 10.1
    },
    {
        "Age Range": "79-80",
        "Expectation of life at age x": 9.6
    },
    {
        "Age Range": "80-81",
        "Expectation of life at age x": 9.0
    },
    {
        "Age Range": "81-82",
        "Expectation of life at age x": 8.4
    },
    {
        "Age Range": "82-83",
        "Expectation of life at age x": 7.9
    },
    {
        "Age Range": "83-84",
        "Expectation of life at age x": 7.4
    },
    {
        "Age Range": "84-85",
        "Expectation of life at age x": 6.9
    },
    {
        "Age Range": "85-86",
        "Expectation of life at age x": 6.4
    },
    {
        "Age Range": "86-87",
        "Expectation of life at age x": 6.0
    },
    {
        "Age Range": "87-88",
        "Expectation of life at age x": 5.6
    },
    {
        "Age Range": "88-89",
        "Expectation of life at age x": 5.1
    },
    {
        "Age Range": "89-90",
        "Expectation of life at age x": 4.8
    },
    {
        "Age Range": "90-91",
        "Expectation of life at age x": 4.4
    },
    {
        "Age Range": "91-92",
        "Expectation of life at age x": 4.1
    },
    {
        "Age Range": "92-93",
        "Expectation of life at age x": 3.8
    },
    {
        "Age Range": "93-94",
        "Expectation of life at age x": 3.5
    },
    {
        "Age Range": "94-95",
        "Expectation of life at age x": 3.2
    },
    {
        "Age Range": "95-96",
        "Expectation of life at age x": 3.0
    },
    {
        "Age Range": "96-97",
        "Expectation of life at age x": 2.8
    },
    {
        "Age Range": "97-98",
        "Expectation of life at age x": 2.6
    },
    {
        "Age Range": "98-99",
        "Expectation of life at age x": 2.4
    },
    {
        "Age Range": "99-100",
        "Expectation of life at age x": 2.1
    },
    {
        "Age Range": "100 and over",
        "Expectation of life at age x": 2.0
    }
]

const femaleLifeExpectancyTable = [
    {
        "Age Range": "0-1",
        "Expectation of life at age x": 81.2
    },
    {
        "Age Range": "1-2",
        "Expectation of life at age x": 80.7
    },
    {
        "Age Range": "2-3",
        "Expectation of life at age x": 79.7
    },
    {
        "Age Range": "3-4",
        "Expectation of life at age x": 78.7
    },
    {
        "Age Range": "4-5",
        "Expectation of life at age x": 77.7
    },
    {
        "Age Range": "5-6",
        "Expectation of life at age x": 76.7
    },
    {
        "Age Range": "6-7",
        "Expectation of life at age x": 75.0
    },
    {
        "Age Range": "7-8",
        "Expectation of life at age x": 74.7
    },
    {
        "Age Range": "8-9",
        "Expectation of life at age x": 73.7
    },
    {
        "Age Range": "9-10",
        "Expectation of life at age x": 72.8
    },
    {
        "Age Range": "10-11",
        "Expectation of life at age x": 71.8
    },
    {
        "Age Range": "11-12",
        "Expectation of life at age x": 70.8
    },
    {
        "Age Range": "12-13",
        "Expectation of life at age x": 69.8
    },
    {
        "Age Range": "13-14",
        "Expectation of life at age x": 68.8
    },
    {
        "Age Range": "14-15",
        "Expectation of life at age x": 67.8
    },
    {
        "Age Range": "15-16",
        "Expectation of life at age x": 66.8
    },
    {
        "Age Range": "16-17",
        "Expectation of life at age x": 65.8
    },
    {
        "Age Range": "17-18",
        "Expectation of life at age x": 64.8
    },
    {
        "Age Range": "18-19",
        "Expectation of life at age x": 63.9
    },
    {
        "Age Range": "19-20",
        "Expectation of life at age x": 62.9
    },
    {
        "Age Range": "20-21",
        "Expectation of life at age x": 61.9
    },
    {
        "Age Range": "21-22",
        "Expectation of life at age x": 60.9
    },
    {
        "Age Range": "22-23",
        "Expectation of life at age x": 60.0
    },
    {
        "Age Range": "23-24",
        "Expectation of life at age x": 59.0
    },
    {
        "Age Range": "24-25",
        "Expectation of life at age x": 58.0
    },
    {
        "Age Range": "25-26",
        "Expectation of life at age x": 57.0
    },
    {
        "Age Range": "26-27",
        "Expectation of life at age x": 56.1
    },
    {
        "Age Range": "27-28",
        "Expectation of life at age x": 55.1
    },
    {
        "Age Range": "28-29",
        "Expectation of life at age x": 54.1
    },
    {
        "Age Range": "29-30",
        "Expectation of life at age x": 53.2
    },
    {
        "Age Range": "30-31",
        "Expectation of life at age x": 52.2
    },
    {
        "Age Range": "31-32",
        "Expectation of life at age x": 51.3
    },
    {
        "Age Range": "32-33",
        "Expectation of life at age x": 50.3
    },
    {
        "Age Range": "33-34",
        "Expectation of life at age x": 49.4
    },
    {
        "Age Range": "34-35",
        "Expectation of life at age x": 48.4
    },
    {
        "Age Range": "35-36",
        "Expectation of life at age x": 47.5
    },
    {
        "Age Range": "36-37",
        "Expectation of life at age x": 46.5
    },
    {
        "Age Range": "37-38",
        "Expectation of life at age x": 45.6
    },
    {
        "Age Range": "38-39",
        "Expectation of life at age x": 44.6
    },
    {
        "Age Range": "39-40",
        "Expectation of life at age x": 43.7
    },
    {
        "Age Range": "40-41",
        "Expectation of life at age x": 42.7
    },
    {
        "Age Range": "41-42",
        "Expectation of life at age x": 41.8
    },
    {
        "Age Range": "42-43",
        "Expectation of life at age x": 40.9
    },
    {
        "Age Range": "43-44",
        "Expectation of life at age x": 39.9
    },
    {
        "Age Range": "44-45",
        "Expectation of life at age x": 39.0
    },
    {
        "Age Range": "45-46",
        "Expectation of life at age x": 38.1
    },
    {
        "Age Range": "46-47",
        "Expectation of life at age x": 37.1
    },
    {
        "Age Range": "47-48",
        "Expectation of life at age x": 36.2
    },
    {
        "Age Range": "48-49",
        "Expectation of life at age x": 35.3
    },
    {
        "Age Range": "49-50",
        "Expectation of life at age x": 34.4
    },
    {
        "Age Range": "50-51",
        "Expectation of life at age x": 33.5
    },
    {
        "Age Range": "51-52",
        "Expectation of life at age x": 32.6
    },
    {
        "Age Range": "52-53",
        "Expectation of life at age x": 31.7
    },
    {
        "Age Range": "53-54",
        "Expectation of life at age x": 30.8
    },
    {
        "Age Range": "54-55",
        "Expectation of life at age x": 29.9
    },
    {
        "Age Range": "55-56",
        "Expectation of life at age x": 29.0
    },
    {
        "Age Range": "56-57",
        "Expectation of life at age x": 28.2
    },
    {
        "Age Range": "57-58",
        "Expectation of life at age x": 27.3
    },
    {
        "Age Range": "58-59",
        "Expectation of life at age x": 26.5
    },
    {
        "Age Range": "59-60",
        "Expectation of life at age x": 25.6
    },
    {
        "Age Range": "60-61",
        "Expectation of life at age x": 24.8
    },
    {
        "Age Range": "61-62",
        "Expectation of life at age x": 24.0
    },
    {
        "Age Range": "62-63",
        "Expectation of life at age x": 23.1
    },
    {
        "Age Range": "63-64",
        "Expectation of life at age x": 22.3
    },
    {
        "Age Range": "64-65",
        "Expectation of life at age x": 21.5
    },
    {
        "Age Range": "65-66",
        "Expectation of life at age x": 20.7
    },
    {
        "Age Range": "66-67",
        "Expectation of life at age x": 19.9
    },
    {
        "Age Range": "67-68",
        "Expectation of life at age x": 19.1
    },
    {
        "Age Range": "68-69",
        "Expectation of life at age x": 18.3
    },
    {
        "Age Range": "69-70",
        "Expectation of life at age x": 17.5
    },
    {
        "Age Range": "70-71",
        "Expectation of life at age x": 16.8
    },
    {
        "Age Range": "71-72",
        "Expectation of life at age x": 16.0
    },
    {
        "Age Range": "72-73",
        "Expectation of life at age x": 15.2
    },
    {
        "Age Range": "73-74",
        "Expectation of life at age x": 14.5
    },
    {
        "Age Range": "74-75",
        "Expectation of life at age x": 13.8
    },
    {
        "Age Range": "75-76",
        "Expectation of life at age x": 13.1
    },
    {
        "Age Range": "76-77",
        "Expectation of life at age x": 12.4
    },
    {
        "Age Range": "77-78",
        "Expectation of life at age x": 11.7
    },
    {
        "Age Range": "78-79",
        "Expectation of life at age x": 11.1
    },
    {
        "Age Range": "79-80",
        "Expectation of life at age x": 10.4
    },
    {
        "Age Range": "80-81",
        "Expectation of life at age x": 9.8
    },
    {
        "Age Range": "81-82",
        "Expectation of life at age x": 9.2
    },
    {
        "Age Range": "82-83",
        "Expectation of life at age x": 8.6
    },
    {
        "Age Range": "83-84",
        "Expectation of life at age x": 8.1
    },
    {
        "Age Range": "84-85",
        "Expectation of life at age x": 7.5
    },
    {
        "Age Range": "85-86",
        "Expectation of life at age x": 7.0
    },
    {
        "Age Range": "86-87",
        "Expectation of life at age x": 6.5
    },
    {
        "Age Range": "87-88",
        "Expectation of life at age x": 6.0
    },
    {
        "Age Range": "88-89",
        "Expectation of life at age x": 5.6
    },
    {
        "Age Range": "89-90",
        "Expectation of life at age x": 5.2
    },
    {
        "Age Range": "90-91",
        "Expectation of life at age x": 4.8
    },
    {
        "Age Range": "91-92",
        "Expectation of life at age x": 4.4
    },
    {
        "Age Range": "92-93",
        "Expectation of life at age x": 4.1
    },
    {
        "Age Range": "93-94",
        "Expectation of life at age x": 3.8
    },
    {
        "Age Range": "94-95",
        "Expectation of life at age x": 3.5
    },
    {
        "Age Range": "95-96",
        "Expectation of life at age x": 3.2
    },
    {
        "Age Range": "96-97",
        "Expectation of life at age x": 3.0
    },
    {
        "Age Range": "97-98",
        "Expectation of life at age x": 2.8
    },
    {
        "Age Range": "98-99",
        "Expectation of life at age x": 2.6
    },
    {
        "Age Range": "99-100",
        "Expectation of life at age x": 2.4
    },
    {
        "Age Range": "100 and over",
        "Expectation of life at age x": 2.2
    }
]




module.exports = { lifeExpectancyTable, femaleLifeExpectancyTable }
