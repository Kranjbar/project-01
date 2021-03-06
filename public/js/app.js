
$(document).ready(function() {
  console.log('app.js loaded!');
  var autocomplete;
  $.get('/api/projects').success(function (projects) {
    projects.forEach(function(project) {
      renderProject(project);
    });
  });

  $('#project-form form').on('submit', function(e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post('/api/projects', formData, function(project) {
      renderProject(project);
    });
    $(this).trigger("reset");
  });

  $('#projects').on('click', '.add-organizer', function(e) {
    var id = $(this).parents('.project').data('project-id');
    $('#organizerModal').data('project-id', id);
    $('#organizerModal').modal();
  });

  $('#saveOrganizer').on('click', handleNewOrganizerSubmit);

  $('#projects').on('click', '.delete-project', handleDeleteProjectClick);

  $('#projects').on('click', '.edit-project', handleEditProjectClick);

  $('#projects').on('click', '.put-project', handleUpdateProject);

  $('#editOrganizersModal').on('click', '.delete-organizer', handleDeleteOrganizerClick);

  $('#projects').on('click', '.edit-organizers', handleEditOrganizersClick);

  $('#editOrganizersModal').on('submit', 'form', handleUpdateOrganizer);
});

function handleUpdateOrganizer(e) {
  e.preventDefault();
  // get the values from the item on the modal
  var projectId = $(this).attr('id');
  var firstName = $(this).find('.organizer-firstName').val();
  var lastName = $(this).find('.organizer-lastName').val();
  var email = $(this).find('.organizer-email').val();

  var organizerId = $(this).find('.delete-organizer').attr('data-organizer-id');
  var url = '/api/projects/' + projectId + '/organizers/' + organizerId;
  var $projectRow = getProjectRowById(projectId);
  $.ajax({
    method: 'PUT',
    url: url,
    data: { firstName: firstName, lastName: lastName, email: email },
    success: function (project) {
      $projectRow.remove();
      renderProject(project);
    }
  });
}

function handleEditOrganizersClick(e) {
  e.preventDefault();
  var projectId = $(this).parents('.project').data('project-id');
  // get the organizers for this project
  $.get('/api/projects/' + projectId + '/organizers').success(function(organizers) {
    var formHtml = generateEditOrganizersModalHtml(organizers, projectId);
    $('#editOrganizersModalBody').html(formHtml);
    $('#editOrganizersModal').modal('show');
  });
}

// takes an array of organizers and generates an EDIT form for them
function generateEditOrganizersModalHtml(organizers, projectId) {
  var html = '';
  organizers.forEach(function(organizer) {
    html += '<form class="form-inline" id="' + projectId  + '"' +
            '  <div class="form-group">' +
            '    <input type="text" class="form-control organizer-firstName" value="' + organizer.firstName + '">' +
            '  </div>'+
            '  <div class="form-group">' +
            '    <input type="text" class="form-control organizer-lastName" value="' + organizer.lastName + '">' +
            '  </div>'+
            '  <div class="form-group">' +
            '    <input type="text" class="form-control organizer-email" value="' + organizer.email + '">' +
            '  </div>'+
            '  <div class="form-group">' +
            '    <button class="btn btn-danger delete-organizer" data-organizer-id="' + organizer._id + '">x</button>' +
            '  </div>'+
            '  <div class="form-group">' +
            '    <button type="submit" class="btn btn-success save-organizer" data-organizer-id="' + organizer._id + '">save</button>' +
            '  </div>'+
            '</form>';
  });

  return html;
}

function handleDeleteOrganizerClick(e) {
  e.preventDefault();
  var organizerId = $(this).data('organizer-id');
  var projectId = $(this).closest('form').attr('id');
  var $projectRow = getProjectRowById(projectId);
  var $thisOrganizer = $(this);
  var requestUrl = ('/api/projects/' + projectId + '/organizers/' + organizerId);
  $.ajax({
    method: 'DELETE',
    url: requestUrl,
    success: function(project) {
      $thisOrganizer.closest('form').remove();
      $projectRow.remove();
      renderProject(project);
    }
  });
}

function handleEditProjectClick(e) {
  var projectId = $(this).parents('.project').data('project-id');
  var $projectRow = getProjectRowById(projectId);

  // replace edit button with save button
  $(this).parent().find('.btn').hide();
  $(this).parent().find('.default-hidden').show();

  // replace current spans with inputs
  var what = $projectRow.find('span.project-what').text();
  $projectRow.find('span.project-what').html('<input class="edit-project-what" value="' + what + '" required=""></input>');

  var when = $projectRow.find('span.project-when').text();
  $projectRow.find('span.project-when').html('<input class="edit-project-when" value="' + when + '" type="date" required=""></input>');

  var where = $projectRow.find('span.project-where').text();
  $projectRow.find('span.project-where').html('<input class="edit-project-where" value="' + where + '" required=""></input>');
}

function handleUpdateProject(e) {
  var projectId = $(this).parents('.project').data('project-id');
  var $projectRow = getProjectRowById(projectId);

  var data = {
    what: $projectRow.find('.edit-project-what').val(),
    when: $projectRow.find('.edit-project-when').val(),
    where: $projectRow.find('.edit-project-where').val()
  };

  $.ajax({
    method: 'PUT',
    url: '/api/projects/' + projectId,
    data: data,
    success: function(project) {
      console.log(data);
      //remove old entry
      $projectRow.remove();
      // render a replacement
      renderProject(project);
    }
  });
}

function handleDeleteProjectClick(e) {
  var projectId = $(this).parents('.project').data('project-id');
  $.ajax({
    method: 'DELETE',
    url: ('/api/projects/' + projectId),
    success: function() {
      getProjectRowById(projectId).remove();
    }
  });
}

function handleNewOrganizerSubmit(e) {
  var projectId = $('#organizerModal').data('project-id');
  var firstName = $('#firstName').val();
  var lastName = $('#lastName').val();
  var email = $('#email').val();
  var formData = {
    firstName: firstName,
    lastName: lastName,
    email: email
  };
  var postUrl = '/api/projects/' + projectId + '/organizers';
  $.post(postUrl, formData)
    .success(function(organizer) {
      // re-get full project and render on page
      $.get('/api/projects/' + projectId).success(function(project) {
        //remove old entry
        $('[data-project-id='+ projectId + ']').remove();
        // render a replacement
        renderProject(project);
      });
      //clear form
      $('#firstName').val('');
      $('#lastName').val('');
      $('#email').val('');
      $('#organizerModal').modal('hide');
    });
}

function getProjectRowById(id) {
  return $('[data-project-id=' + id + ']');
}

// this function takes a single project and renders it to the page
function renderProject(project) {
  var template = $('#projectTemplate').html();

  var compiledTemplate = Handlebars.compile(template);
  var htmlFromCompiledTemplate = compiledTemplate( { project: project } );

  $('#projects').prepend( htmlFromCompiledTemplate );

}

function initAutocomplete() {
  // Create the autocomplete object, restricting the search to geographical
  // location types.
  autocomplete = new google.maps.places.Autocomplete((document.getElementById('autocomplete')), {types: ['geocode']});

  // When the user selects an address from the dropdown, populate the address
  // field in the input.
  autocomplete.addListener('place_changed', fillInAddress);
}

function fillInAddress() {
  var place = autocomplete.getPlace();
  var address = place.formatted_address;
  $('#autocomplete').val(address);
}

function geolocate() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var geolocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      var circle = new google.maps.Circle({
        center: geolocation,
        radius: position.coords.accuracy
      });
      autocomplete.setBounds(circle.getBounds());
    });
  }
}