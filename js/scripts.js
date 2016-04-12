$( document ).ready(function() {
  //  Displaying the current data in Local Storage.
  //  For demostration/debugging purposes only.
  console.log(allLocalStorageData());
  console.log(allLocalStorageKeys());
  
  //  Obtaining the JSON file from a remote server
  //  In this demostration, I hosted the JSON file on my dropbox account.
  var obj;
  $.ajax({
  	 type: "GET",
  	 url: 'https://dl.dropboxusercontent.com/u/8706499/timeSlots.json',
  	 async: true,
     dataType: "json",
     success: function(data){
       obj = data;
     },
     error: function(err) {
      console.log(err)
    }
  });

  //  Initializing Bootstrap-Datapicker
  $('.datepicker').datepicker();

  //  Populate the time slots from the JSON and enable the field
  $('#txtDate').on('blur', function(){
      ($(this).val()) ? $('#ddlTimeSlots').prop('disabled',false) : $('#ddlTimeSlots').prop('disabled',true);
      $('#ddlTimeSlots').empty().append('<option value="0">Select One</option>');
      loadTimeSlots(obj);
  });

  //  Checks Local Storage to see if the date key is valid.
  //  Checks to see if the time slot matches the one in the Local Storage, if it does, then use the seat available from the Local Storage
  //  If the timeslot is not in the Local Storage, use the seat available from the JSON file
  $('#ddlTimeSlots').on('change',function(){
    var TimeSelected = $('#ddlTimeSlots option:selected').val(),
        LSDateKey = $('#txtDate').val(),
        LSDataValue = getLocalStorageData(LSDateKey, TimeSelected);

    LSDataValue = (LSDataValue == undefined || LSDataValue == null || LSDataValue.length == 0) ? [] : $.parseJSON(LSDataValue)

    if ( LSDataValue === null || TimeSelected !== LSDataValue.TimeSlots){
      $.each(obj.timeSlots, function(key, data){
        if (data.StartTime == TimeSelected) { $('#txtAvailableSeats').val(data.SeatsAvailable); return false; }
      });
    }
    else {
      $('#txtAvailableSeats').val(LSDataValue.SeatsRemaining);
    }
  });

  //  Store Data into Local Storage and append Reservation Information into the Bootstrap Modal
  $('#btnConfirm').on('click', function(){    
      //  Checks to see if a date and time selection has been made.
      if($('#ddlTimeSlots option:selected').val() != 0 && $('#txtDate').val() != ""){
        var NewDateKey = $('#txtDate').val(),
        TimeSelected = $('#ddlTimeSlots option:selected').val(),
        NewDataValue = {TimeSlots: TimeSelected, SeatsRemaining: $('#txtAvailableSeats').val() - 1};
        
        $('#confirmationModelContent').html('Your reservation for ' + NewDateKey + ' at ' + TimeSelected + ' has been confirmed.');
          storeLocalStorageData(NewDateKey,NewDataValue);
        //  Clear the input field after a successful reservation.
        resetField();
      }
      else{
        //  Message prompt for missing date or time selection for the reservation.
        $('#confirmationModelContent').html('Please select a date and time for your reservation.')
      }
  });
});
  
//  Reset Local Storage data for demostration purposes.
$('#btnReset').on('click', function(){
	deleteLocalStorageData();
  location.reload();
});

//  Dynamically loads the Time Slots that are in the JSON file to the drop down select
function loadTimeSlots(Obj){  
  var LSDataValue = null;  
  
  $.each(Obj['timeSlots'], function(key, data){
      $('#ddlTimeSlots').append($('<option>', {
        value: data.StartTime,
        text : data.StartTime + ' - ' +  data.EndTime
      }));
  });
  
  /*
    Local Storage only provides a <key, value> pair, and only stores them as strings.
    I check the Local Storage to see if the key has a value associated with it.
    The return value might have multiple JSON object stored, sperarted by semi-colons.
    I split the return value by a semi-colon, and check if any JSON object has zero seats.
    If the JSON object has zero seats, then I disable the time slot selection.
  */
  if(localStorage.getItem($('#txtDate').val()) != null){
    if(localStorage.getItem($('#txtDate').val()).split(";").length > 1){
      $.each(localStorage.getItem($('#txtDate').val()).split(";"), function(index, value){
        var temp = $.parseJSON(value);
        //  Disable TimeSlot if no seats are available
        if (temp.SeatsRemaining == 0) { disableTimeSlot(temp.TimeSlots);}
      });
    }
    /*
      If the Local Storage return value after being slpit contains only one element or fewer
      Then I set LSDataValue with the sole value from the Local Storage of the key passed.
    */
    else{
      LSDataValue = localStorage.getItem($('#txtDate').val()).split(";")[0];
    }
  }
  
  //  Disable TimeSlot if no seats are available
  if(LSDataValue != null){
    var tmp = $.parseJSON(LSDataValue);
    if (tmp.SeatsRemaining == 0) { disableTimeSlot(tmp.TimeSlots);}
  }
}

/*
  Function that accepts the string value of the #ddlTimeSlots's option.
  Disables the time slot from the time selected, i.e. "7:00PM" will disable
  The time slot of: 7:00PM - 8:00PM, from the menu.
*/
function disableTimeSlot(dropDownTimeSlot){
  $('#ddlTimeSlots').children('option[value="' + dropDownTimeSlot + '"]').prop('disabled', true);
}


//  Return empty array if the Key is not found in the Local Storage, else return JSON object
function getLocalStorageData(Key, timeSlotSelected){
  //  Local variable to store the index.
  var foundIndex = 0, Obj = [];
  
  /*
    Local Storage only provides a <key, value> pair, and only stores them as strings.
    I check the Local Storage to see if the key has a value associated with it.
    The return value might have multiple JSON object stored, sperarted by semi-colons.
    I split the return value by a semi-colon, and check if any JSON object contains the time slot selected.
    If the JSON object has the time slot slected, then I set the local foundIndex variable to the found index.
    foundIndex will be used to know which element to select when I split the Local Storage's value.
  */
  if(localStorage.getItem(Key) != null && localStorage.getItem(Key).split(";").length > 1){
    $.each(localStorage.getItem(Key).split(";"), function(index, value){
      if(value.indexOf(timeSlotSelected) != -1){
        foundIndex = index;
      }
    });
  }
    
  if(localStorage.getItem(Key) != null){
    var Obj = ($.parseJSON(localStorage.getItem(Key).split(";")[foundIndex]) === null) ? [] : JSON.stringify(localStorage.getItem(Key).split(";")[foundIndex])
    Obj = (Obj == undefined || Obj == null || Obj.length == 0) ? Obj : $.parseJSON(Obj)
  }
  return Obj;
}

// Store the Key (Date), Value (Time, Seats Available) into the Local Storage
function storeLocalStorageData(Key, Value){
    var tmp = [],
        tempVar = [],
        obj = JSON.stringify(Value),
        LSDataValue = getLocalStorageData(Key, Value.TimeSlots);
    
    //  Checks if the LSDataValue is not null.
    if (LSDataValue != undefined && LSDataValue != null && LSDataValue.length > 0) {
      var ls = $.parseJSON(LSDataValue);
      /*
        Checking if the time slot selected is not the same as the Local Storage's returned value time slot
        I push the current Local Storage's returned value into the local variable "tmp", to append into
        the current Local Storage <key, value> pair and separate the multiple JSON object by semi-colons.
      */
      if (Value.TimeSlots != ls.TimeSlots){
        tmp.push(localStorage[Key]);
      }
      /*
        If the selected time slot is the same as the Local Storage's returned value time slot,
        Then value might contain multple JSON object, I push the entire Local Storage's return value into
        The local variable "tempVar" for further manipulation.
      */
      else{
        tempVar.push(localStorage[Key]);
      }
    }
    
    /*
      If the local variable "tempVar" contains more than one element, it means I need to manipulate the array.
      I split tempVar's stored JSON objects by a semi-colon and loop into each element to find if any
      Of the JSON object's time slot does not matches the selected time slot then I push that JSON object
      Into the local variable "tmp" to store into localStorage.
      I want to only store the JSON object that does not contain the selected time slot because the
      Selected time slot's JSON object will be overwirtten with the updated seat information from submitting a new reservation.
    */
    if(tempVar.length > 0){
      $.each(tempVar[0].split(";"), function(index, value){
        if(value.indexOf(Value.TimeSlots) < 0){
          tmp.push(value);
        }
      });
    }
    
    /*
      Replace the stored element's comma as semi-colon, makes splitting by semi-colon possible.
    */
    tmp.push(obj);
    var temp = tmp.join(";");
    localStorage.setItem(Key,temp);
}

//  Returns all data from the Local Storage -- For debugging only.
function allLocalStorageData() {
  var values = [],
      keys = Object.keys(localStorage),
      i = keys.length;
  while ( i-- ) {
      values.push( localStorage.getItem(keys[i]) );
  }
  return values;
}

//  Returns all Keys from the Local Storage -- For debugging only.
function allLocalStorageKeys(){
  var values = [];
  for (var key in localStorage){
     values.push(key)
  }
  return values;
}

//  Deletes all data in the Local storage -- For debugging only.
function deleteLocalStorageData(){
  localStorage.clear();
}

//  Resets the fields.
function resetField(){
  $('#txtDate, #txtAvailableSeats').val('');
  $('#ddlTimeSlots').empty().prop('disabled',true);
}
