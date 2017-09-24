//increases this number by 1 each time we add a student, used an a unique id for each student
studentIDNumber=0;
//buffer to add time of day (measured as minutes since beginning of 2017) to assignment start/stop times
dayTime=0;

monthStartTimes=[0,365,396,424,455,485,516,181,212,243,272,303,333];
minsInDay=1440;

reader.addEventListener('finishedParse', processHomeworkSheet,false)

//array which contains all student objects
studentList = [];

//array which contains all courses
var courseList=new Array();

//adds hardcoded class name to SOM to avoid different naming schemes messing up data
courseList.push(new course("SOM"));

courseList.getCourse=function(name,suppressErrors){
  if(name.includes("SOM")){
    return(this[0]);
  }

  for(i=0;i<this.length;i++){
    if(this[i].courseCode==name){
      return this[i];
    }
  }
  if(!suppressErrors){console.log("Lookup for course ''"+name+"'' failed!");}
  return null;
}

function processHomeworkSheet(){
  printCSV();
  studentList =  studentList.concat(new studentData(CSVArray));
  //makeTable(studentList);
}

function course(name){
    this.courseCode=name;
    this.courseID=courseList.length;
    this.isLanguage=false;
    if(this.courseCode.includes("SPAN")){
      this.isLanguage=true;
      this.languageLevel=parseInt(this.courseCode[4]);
    } else if(this.courseCode.includes("CHIN")){
      this.isLanguage=true;
      this.languageLevel=parseInt(this.courseCode[4]);
    } else if(this.courseCode.includes("JPN")){
      this.isLanguage=true;
      this.languageLevel=parseInt(this.courseCode[3]);
    } else if(this.courseCode.includes("ASML")){
      this.isLanguage=true;
      this.languageLevel=parseInt(this.courseCode[4]);
    }
    this.students=[];
    console.log("Added new course ''"+this.courseCode+"''.")
};
//creates a student data object given a 2D array
function studentData(dataArray){
  //assigns student a new unique ID
  this.studentID=studentIDNumber;
  studentIDNumber=studentIDNumber+1;

  this.assignmentArray=[];
  dayTime=0;
  //console.log("reading course list");
  this.courseList=readCourseList(this,dataArray,[1,7]);

  for(i=0;i<CSVArray.length;i++){
    if(CSVArray[i][1]=="DAY"){
      //gets the number of minutes since 2017 began that the date is on
      if(CSVArray[i][3].length==3){
        dayTime=1440*(parseInt(CSVArray[i][3][1]+CSVArray[i][3][2])+monthStartTimes[CSVArray[i][2]]);
      }
      else if(CSVArray[i][3].length==2){
        dayTime=1440*(parseInt(CSVArray[i][3][1])+monthStartTimes[CSVArray[i][2]]);
      }
    }

    else if(CSVArray[i][0].length>3&&this.courseList.includes(CSVArray[i][0])){
      //length check is to make blank cells will not reead as assignments if class code list is not filled out
      //console.log("reading assignment from "+CSVArray[i][0]);
      this.assignmentArray.push(new assignment(CSVArray[i][0],CSVArray[i][1],CSVArray[i][2],CSVArray[i][3]));
    }
  }

  console.log("Created new student with "+this.assignmentArray.length+" assignments.")
  return this;
}

function assignment(courseName,assignmentName,startTimeString,endTimeString){
  this.course=courseName;
  this.assignmentName=assignmentName;
  this.startTime=interpretTime(startTimeString);
  this.endTime=interpretTime(endTimeString);
  //if assignment goes over AM-PM divide, makes sure we still have times that make sense
  if(this.startTime>this.endTime){
    this.endTime=this.endTime+720;
  }
  this.assignmentDuration=this.endTime-this.startTime;
  return this;
}

function interpretTime(timeString){
  //parses string representation of time into minutes since start of day
  if (timeString.includes("PM")){
    if (timeString[1]==":") {
      //single digit hour
      return (720+(60*timeString[0])+parseInt(timeString[2]+timeString[3]));
    }
    else {
      return (720+(60*(timeString[0]+timeString[1]))+parseInt(timeString[3]+timeString[4]));
    }
  }
  else {
    if (timeString[1]==":") {
      //single digit hour
      return ((60*timeString[0])+parseInt(timeString[2]+timeString[3]));
    }
    else {
      return ((60*(timeString[0]+timeString[1]))+parseInt(timeString[3]+timeString[4]));
    }
  }
  console.log("Reading of time string ''"+timeString+"'' failed!");
  return null;
}

function readCourseList(student,dataArray,coordinates){
  courseArray=[];
  for(p=0;p<8;p++){
      if(dataArray[coordinates[0]+p][coordinates[1]].length>2){
      courseArray[p]=dataArray[coordinates[0]+p][coordinates[1]];
      //TODO: write code to add course to global course list if it is not already
      //      found there
      //if course does not already exist, create course
      if(courseList.getCourse(dataArray[coordinates[0]+p][coordinates[1]],true)==null&&dataArray[coordinates[0]+p][coordinates[1]].length>2){
        courseList.push(new course(dataArray[coordinates[0]+p][coordinates[1]]));
      }
      //adds student to course
      courseList.getCourse(dataArray[coordinates[0]+p][coordinates[1]]).students.push(student);
    }
  }
  return courseArray;
}
