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
courseList.push(new course("QUEST"));

courseList.getCourse=function(name,suppressErrors){
  name=name.toUpperCase();

  if(name.includes("SOM")){
    return(this[0]);
  }
  else if(name.includes("QUEST")){
    return(this[1]);
  }

  for(l=0;l<this.length;l++){
    if(this[l].courseCode==name){
      return this[l];
    }
  }
  if(!suppressErrors){console.log("Lookup for course ''"+name+"'' failed!");}
  return null;
}

function printCourseBreakdown(){
  var courseBreakdownTableBuffer=[];
  courseBreakdownTableBuffer.push(["Course Code","Students","Avg. Time Logged","Total Time Logged","Standard Deviation (% of Avg.)"])
  for(y=0;courseList.length>y;y++){
    courseList[y].updateInfo();
    courseBreakdownTableBuffer.push( [courseList[y].courseCode, courseList[y].students.length, courseList[y].avgTotalTime, courseList[y].totalTime, (100*(courseList[y].stdev/courseList[y].avgTotalTime)+"%") ]);
  }
  makeTable(courseBreakdownTableBuffer);
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
  this.avgTotalTime=0;
  this.totalTime=0;
  this.stdev=0;

  this.updateInfo=function(){
    this.avgTotalTime=0;
    var studentTimeBufferArray=[];
    for(r=0;r<this.students.length;r++){
      if(isNaN(this.students[r].courseTimeSpentList[this.students[r].courseList.indexOf(this)])){
        console.log("ERROR: "+this.courseCode+" total student ''"+this.students[r].courseTimeSpentList[this.students[r].courseList.indexOf(this)]+"'' is NaN.");
      }
      else{
        studentTimeBufferArray.push(this.students[r].courseTimeSpentList[this.students[r].courseList.indexOf(this)]);
        this.avgTotalTime=this.avgTotalTime+this.students[r].courseTimeSpentList[this.students[r].courseList.indexOf(this)];
      }
    }
    if(isNaN(this.avgTotalTime)){
      console.log("ERROR: "+this.courseCode+" total time ''"+this.avgTotalTime+"'' is NaN.");
    }
    this.totalTime=this.avgTotalTime;
    this.avgTotalTime=this.avgTotalTime/this.students.length;
    this.stdev=stdev(studentTimeBufferArray);
  }

  console.log("Added new course ''"+this.courseCode+"''.");
  return this;
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

  this.courseTimeSpentList=[0,0,0,0,0,0,0,0,0];

  for(i=1;i<CSVArray.length;i++){
    if(CSVArray[i][1].includes("DAY")){
      //gets the number of minutes since 2017 began that the date is on
      if(CSVArray[i][3][0]=="/"){
        if(CSVArray[i][3].length==3){
          dayTime=1440*(parseInt(CSVArray[i][3][1]+CSVArray[i][3][2])+monthStartTimes[CSVArray[i][2]]);
        }
        else if(CSVArray[i][3].length==2){
          dayTime=1440*(parseInt(CSVArray[i][3][1])+monthStartTimes[CSVArray[i][2]]);
        }
      }
      else if (CSVArray[i][3].length==2){
        dayTime=1440*(parseInt(CSVArray[i][3][0]+CSVArray[i][3][1])+monthStartTimes[CSVArray[i][2]]);
      }
      else if(CSVArray[i][3].length==1){
        dayTime=1440*(parseInt(CSVArray[i][3][0])+monthStartTimes[CSVArray[i][2]]);
      }
    }

    //else if(CSVArray[i][0].length>2){
    //  this.assignmentArray.push(new assignment(this,courseList.getCourse(CSVArray[i][0]),CSVArray[i][1],CSVArray[i][2],CSVArray[i][3]))
    //}
    else if(CSVArray[i][0].length>2){
      //length check is to make blank cells will not reead as assignments if class code list is not filled out
      //console.log("reading assignment from "+CSVArray[i][0]);
      this.assignmentArray.push(new assignment(this,courseList.getCourse(CSVArray[i][0]),CSVArray[i][1],CSVArray[i][2],CSVArray[i][3],dayTime));
    }

  }
  for (q=0;q<this.courseList.length;q++){
    if(this.courseList[q]){
      this.courseList[q].updateInfo;
    }
  }
  console.log("Created new student with "+this.assignmentArray.length+" assignments.")
  return this;
}

function assignment(student,course,assignmentName,startTimeString,endTimeString,dayTime){
  this.course=course;
  this.assignmentName=assignmentName;

  this.startTime=interpretTime(startTimeString);
  this.endTime=interpretTime(endTimeString);
  //if assignment goes over AM-PM divide, makes sure we still have times that make sense
  if(this.startTime>this.endTime){
    this.endTime=this.endTime+720;
  }
  this.assignmentDuration=this.endTime-this.startTime;

  //adds assignment duration to student time tally
  if(student.courseList.indexOf(this.course)!=-1&&!isNaN(this.assignmentDuration)){
    student.courseTimeSpentList[student.courseList.indexOf(this.course)]=student.courseTimeSpentList[student.courseList.indexOf(this.course)]+this.assignmentDuration;
  }
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
  for(p=0;p<9;p++){
    if(dataArray[coordinates[0]+p][coordinates[1]].length>2){
      //if course does not already exist, create course
      if(courseList.getCourse(dataArray[coordinates[0]+p][coordinates[1]],true)==null&&dataArray[coordinates[0]+p][coordinates[1]].length>2){
        courseList.push(new course(dataArray[coordinates[0]+p][coordinates[1]]));
      }
      //adds student to course
      courseArray[p]=courseList.getCourse(dataArray[coordinates[0]+p][coordinates[1]]);
      courseList.getCourse(dataArray[coordinates[0]+p][coordinates[1]]).students.push(student);
    }
  }
  return courseArray;
}
