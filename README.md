validateform
============

Validate Form with JQuery Validate Plugin

This plugin will focus on html tag attribute for its validation will just a small coding in javascript.

#### HTML ####

    <form id="validate_form">
      <ul>
    		<li>
    			<input type="text" name="username" validate="required" />
    		</li>
    		<li>
    			<input type="password" name="password" validate="required|rangelength[8,20]" />
    		</li>
    		<li>
    			<input type="password" name="confirm_password" validate="equalto[name='password']" />
    		</li>
    		<li>
    			<button id="submit_button" type="button">Submit</button>
    		</li>
    	</ul>
    </form>

#### JAVASCRIPT ####

	$(function() {
		$("#validate_form").validateForm({
			invalidHandler : function(form, validator) {
				alert('Please fill up the required fields.'); // You can remove this part. This will only remind the user that he/she does not yet complete filluping the form.
			}
		});
		
		$("#submit_button").click(function() {
			if ($("#validate_form").valid()) {
				alert("All field has been filled up!");
			}
		});
	});

This plugin is still have more room for improvements, so bare with me. I will add more functions or if you have some ideas or suggestions about the validation you free to send me a mail at vjcenas@yahoo.com or vjcenas@gmail.com .
I'm not entertaining questions at this moment because of the busy schedule.

Thank you.
