/**
 *  Form Validator Plugin 1.0.1
 *
 *	Description: Validate form via HTML attribute "validate"
 *
 *	@author Venstin John Q. Cenas
 *	 
 *	Email: vjcenas@yahoo.com
 *	Since: Aug 12, 2011
 *	Last Update: March 11, 2013
 *
 *	Dependency : http://bassistance.de/jquery-plugins/jquery-plugin-validation/
 *
 *	HTML	
 *
 *	Command - eg. <input type="text" name="validate_me" validate="required|url" /> Note: Element name is required.
 *	
 *	- required
 *	- decimal
 *	- date - 2011-12-31 YYYY-MM-DD
 *	- digits
 *	- url
 *	- email
 *	- minlength[num]
 *	- maxlength[num]
 *	- rangelength[min,max] - String max and min length
 *	- intmin[num] - min int
 *	- intmax[num] - max int
 *	- equalto[selector] # name=selector, #selector, .selector
 *	- visible[selector] # name=selector, #selector, .selector - Shows the selector
 *	- hidden[selector] # name=selector, #selector, .selector - Hides the selector
 *	- ischecked[selector] # name=selector, #selector, .selector - check if the selector is checked
  *	- selected[selector:option value] - check if the selector's selected option is true
 *	- accept[jpg,jpe,png,gif] - check if the extension is true
 *	- lessthan[selector] - must be less than the selector's value
 *	- greaterthan[selector] - must be greater than the selector's value
 *	- checkdate[startdate] - check for the start date and the selectors date
 *	- nospecial
 *  - regexmatch - Match the value with the regular expression
 *  - emptyrequired - Check if the pointed selector if empty. if it's empty the pointer selector will be required
 *
 *	JAVASCRIPT
 *
 *	$(selector).validateForm(options); // Options are the same with jQuery Validate
 *
 *	To enable submit form if valid is true
 *	Note: Use input type submit
 *
 *	- $(form).submit(function(){
 *			this.submit();
 *	  });
 */
 
;(function($) {

$.fn.validateForm = function(options) {
	// if nothing is selected, return nothing; can't chain anyway
	if (!this.length) {
		if (options && options.debug && window.console) {
			console.warn( "Nothing selected, can't validate, returning nothing." );
		}
		return;
	}

	// check if a validateForm for this form was already created
	var validateForm = $.data(this[0], "validateForm");
	if (validateForm) {
		return validateForm;
	}

	validateForm = new $.validateForm(options, this[0]);
	$.data(this[0], "validateForm", validateForm);
	
	return validateForm;
}

$.validateForm = function(options, form) {
	this.options = options;
	this.form = form;
	this.init();
};

$.extend($.validateForm, {
	defaults : {
		onsubmit: true,
		submitHandler : function(){
			return false;
		},
		errorElement : "span",
		invalidHandler : function(form, validator) {
			common.alertMessage('error', 'Please fill up the required fields.', 5000);
		}
	},
	
	messages : {
		dateConflict : "Invalid Date.",
		noSpecial : "Please enter letters and numbers only.",
		regexMatch : "Please input a valid format"
	},
	
	collection : {},
	
	prototype : {
		init : function() {
			var validateForm = this;
		
			if (this.options != undefined && typeof options == "object") {
				$.each(options, function(key, val) {	
					$.validateForm.defaults[key] = val;
				});
			}

			$(this.form).validate($.validateForm.defaults);

			$(this.form).find("input[validate], select[validate], button[validate], textarea[validate]").each(function() {
				if ($(this).attr("validate") != undefined) {
				
					var validator = $(this).attr("validate").split("|");
					var content = $(this).attr("validate");
					var	selector = $(this);
					var validators = {};
				
					if ($.inArray("required", validator) != "-1") {
						validators.required = true;
						selector.attr("aria-required", true);
					}
						
					if ($.inArray("email", validator) != "-1") {
						validators.email = true;
					}

					if (content.search("minlength") != "-1") {
						validators.minlength = parseInt(validateForm.trimString(content, "minlength"));
					}
						
					if (content.search("maxlength") != "-1") {
						var maxLength = parseInt(validateForm.trimString(content, "maxlength"));
						selector.attr("maxlength", maxLength);
						validators.maxlength = maxLength;
					}

					if ($.inArray("digits", validator) != "-1") {
						validators.digits = true;
					}
						
					if ($.inArray("decimal", validator) != "-1") {
						validators.number = true;
					}
						
					if ($.inArray("url", validator) != "-1") {
						validators.url = true;
					}
				
					if ($.inArray("date", validator) != "-1") {
						validators.dateISO = true;
					}

					if (content.search("intmin") != "-1") {
						var min = parseInt(validateForm.trimString(content, "intmin"));
						selector.attr("aria-valuemin", min);
						validators.min = min;
					}
						
					if (content.search("intmax") != "-1") {
						var max = parseInt(validateForm.trimString(content, "intmax"));
						selector.attr("aria-valuemax", max);
						validators.max = max;
					}
					
					if (content.search("equalto") != "-1") {
						validators.equalTo = function() {	
							var aContent = content.split("equalto[")[1].split("]");
							var equalto = aContent[0];
							return equalto.search("=") != "-1" ? "[" + aContent[0] + "]" : aContent[0];
						}
					}
					
					if (content.search("rangelength") != "-1") {
						validators.rangelength = function() {
							var aContent = content.split("rangelength[")[1].split(",");
							var rangemin = parseInt(aContent[0]);
							aContent = aContent[1].split(",");
							aContent = aContent[0].split("]");
							var rangemax = parseInt(aContent[0]);
							
							selector.attr("maxlength", rangemax);
							
							return [rangemin, rangemax];
						}
					}

					if (content.search("accept") != "-1") {	
						validators.accept = function() {
							return content.split("accept[")[1].split("]")[0].split(",").join('|');
						}
					}
						
					if (content.search("nospecial") != "-1") {
						validators.nospecial = function() {
							$.validator.addMethod("nospecial", function(value, element, param) {
							   return value.match(new RegExp("^" + param + "$"));
							}, $.validateForm.messages.noSpecial);
							
							return "[0-9a-zA-Z ]+";
						}
					}					
					
					if (content.search("regexmatch") != "-1") {
						// This method can be buggy, so be carefull with the regular expressions, it must be inside "['" regular expressions "']" - ignore the double quote.
						validators.regexmatch = function() {
							$.validator.addMethod("regexmatch", function(value, element, param) {
							   return value.match(new RegExp(param));
							}, $.validateForm.messages.regexMatch);
							
							return validateForm.tringRegex(content);
						}
					}

					if (content.search("checkdate") != "-1") {
						var stringContent = validateForm.trimString(content, "checkdate");
						var dateselector = stringContent.search("=") != "-1" ? "[" + stringContent + "]" : stringContent;
						var methodName =  "checkdate_" + stringContent.replace(/^.*?[#.=]+/, ""); // #test, .test, name=test

						
						$.validator.addMethod(methodName, function() {
							var startSelector = $(dateselector).val().split(' ');
							var endSelector = selector.val().split(' ');
							var start = $.datepicker.formatDate('mm/dd/yy', new Date(startSelector[0]));
							var end = $.datepicker.formatDate('mm/dd/yy', new Date(endSelector[0]));
							var startDate = new Date(start);
							var endDate = new Date(end);

							if ($.trim(selector.val()) != "") {
								return (startDate <= endDate);
							} else {
								return true;
							}
						}, $.validateForm.messages.dateConflict);
						
						validators[methodName] = { date: true, dateRange: true };				
					}

					if (content.search("visible") != "-1") {
						var stringContent = validateForm.trimString(content, "visible");
						var visible = stringContent.search("=") != "-1" ? "[" + stringContent + "]" : stringContent;
						if (selector.valid() == false) {
							$(visible).show();
						}
					}
					
					if (content.search("hidden") != "-1") {
						var stringContent = validateForm.trimString(content, "hidden");
						var hidden = stringContent.search("=") != "-1" ? "[" + stringContent + "]" : stringContent;
						if (selector.valid() == false) {
							$(hidden).hide();
						}
					}
					
					if (content.search("notvalue") != "-1") {
						var stringContent = validateForm.trimString(content, "notvalue");
						var value = stringContent.search("=") != "-1" ? "[" + stringContent + "]" : stringContent;
						if ((selector.val()).toLowerCase() == value.toLowerCase()) {
							validators.required = true;
							selector.val("");
						}
					}

					if (content.search("lessthan") != "-1") {
						var stringContent = validateForm.trimString(content, "lessthan");
						lessthan = stringContent.search("=") != "-1" ? "[" + stringContent + "]" : stringContent;
						validators.max = $(lessthan).val();
					}
					
					if (content.search("greaterthan") != "-1") {
						var stringContent = validateForm.trimString(content, "greaterthan");
						greaterthan = stringContent.search("=") != "-1" ? "[" + stringContent + "]" : stringContent;
						validators.min = $(greaterthan).val();
					}
					
					if (content.search("ischecked") != "-1") {
						validators.required = false;
						var stringContent = validateForm.trimString(content, "checked");
						var aChecked = stringContent.split(",");
						var iCount = 0;
						
						$.each(aChecked, function() {
							var sChecked = this.search("=") != "-1" ? "[" + this + "]" : "" + this;
							
							if ($(sChecked).is(":checked") == true) {
								validators.required = true;
							} else {
								iCount++;
							}
						});

						if (iCount > 0) {
							validators.required = false;
							validators.checkdate = false;
							selector.val("")
						};
					}
					
					if (content.search("selected") != "-1") {
						validators.required = false;
						var stringContent = validateForm.trimString(content, "selected");
						var selected = stringContent.split(":");
						if ($(selected[0]).val() == selected[1]) {
							validators.required = true;
						} else {
							selector.val("");
						}
					}
					
					if (content.search("emptyrequired") != "-1") {
						var stringContent = validateForm.trimString(content, "emptyrequired");
						var value = stringContent.search("=") != "-1" ? "[" + stringContent + "]" : stringContent;

						validators.required = function() {
							if ($.trim($(value).val()) == "") {
								return true;
							} else {
								return false;
							}
						};	
					}

					$.validator.messages.required = "";
					selector.rules("add", validators);
				}	
			});
		},
		
		trimString : function(content, type) {
			return $.trim(content.split(type + "[")[1].split("]|")[0].split("]")[0]);
		},
		
		tringRegex : function(content) {
			var regex = /(.*)regexmatch\['(.*)'\](.*)/;
			return content.replace(regex, "$2");
		}
	}
});
	
/*! jQuery Validation Plugin - v1.11.0 - 2/4/2013
* https://github.com/jzaefferer/jquery-validation
* Copyright (c) 2013 JÃ¶rn Zaefferer; Licensed MIT */

$.extend($.fn, {
	// http://docs.jquery.com/Plugins/Validation/validate
	validate: function( options ) {

		// if nothing is selected, return nothing; can't chain anyway
		if ( !this.length ) {
			if ( options && options.debug && window.console ) {
				console.warn( "Nothing selected, can't validate, returning nothing." );
			}
			return;
		}

		// check if a validator for this form was already created
		var validator = $.data( this[0], "validator" );
		if ( validator ) {
			return validator;
		}

		// Add novalidate tag if HTML5.
		this.attr( "novalidate", "novalidate" );

		validator = new $.validator( options, this[0] );
		$.data( this[0], "validator", validator );

		if ( validator.settings.onsubmit ) {

			this.validateDelegate( "input:submit, button:submit", "click", function( event ) {
				if ( validator.settings.submitHandler ) {
					validator.submitButton = event.target;
				}
				// allow suppressing validation by adding a cancel class to the submit button
				if ( $(event.target).hasClass("cancel") ) {
					validator.cancelSubmit = true;
				}
			});

			// validate the form on submit
			this.submit( function( event ) {
				if ( validator.settings.debug ) {
					// prevent form submit to be able to see console output
					event.preventDefault();
				}
				function handle() {
					var hidden;
					if ( validator.settings.submitHandler ) {
						if ( validator.submitButton ) {
							// insert a hidden input as a replacement for the missing submit button
							hidden = $("<input type='hidden'/>").attr("name", validator.submitButton.name).val(validator.submitButton.value).appendTo(validator.currentForm);
						}
						validator.settings.submitHandler.call( validator, validator.currentForm, event );
						if ( validator.submitButton ) {
							// and clean up afterwards; thanks to no-block-scope, hidden can be referenced
							hidden.remove();
						}
						return false;
					}
					return true;
				}

				// prevent submit for invalid forms or custom submit handlers
				if ( validator.cancelSubmit ) {
					validator.cancelSubmit = false;
					return handle();
				}
				if ( validator.form() ) {
					if ( validator.pendingRequest ) {
						validator.formSubmitted = true;
						return false;
					}
					return handle();
				} else {
					validator.focusInvalid();
					return false;
				}
			});
		}

		return validator;
	},
	// http://docs.jquery.com/Plugins/Validation/valid
	valid: function() {
		if ( $(this[0]).is("form")) {
			return this.validate().form();
		} else {
			var valid = true;
			var validator = $(this[0].form).validate();
			this.each(function() {
				valid &= validator.element(this);
			});
			return valid;
		}
	},
	// attributes: space seperated list of attributes to retrieve and remove
	removeAttrs: function( attributes ) {
		var result = {},
			$element = this;
		$.each(attributes.split(/\s/), function( index, value ) {
			result[value] = $element.attr(value);
			$element.removeAttr(value);
		});
		return result;
	},
	// http://docs.jquery.com/Plugins/Validation/rules
	rules: function( command, argument ) {
		var element = this[0];

		if ( command ) {
			var settings = $.data(element.form, "validator").settings;
			var staticRules = settings.rules;
			var existingRules = $.validator.staticRules(element);
			switch(command) {
			case "add":
				$.extend(existingRules, $.validator.normalizeRule(argument));
				staticRules[element.name] = existingRules;
				if ( argument.messages ) {
					settings.messages[element.name] = $.extend( settings.messages[element.name], argument.messages );
				}
				break;
			case "remove":
				if ( !argument ) {
					delete staticRules[element.name];
					return existingRules;
				}
				var filtered = {};
				$.each(argument.split(/\s/), function( index, method ) {
					filtered[method] = existingRules[method];
					delete existingRules[method];
				});
				return filtered;
			}
		}

		var data = $.validator.normalizeRules(
		$.extend(
			{},
			$.validator.classRules(element),
			$.validator.attributeRules(element),
			$.validator.dataRules(element),
			$.validator.staticRules(element)
		), element);

		// make sure required is at front
		if ( data.required ) {
			var param = data.required;
			delete data.required;
			data = $.extend({required: param}, data);
		}

		return data;
	}
});

// Custom selectors
$.extend($.expr[":"], {
	// http://docs.jquery.com/Plugins/Validation/blank
	blank: function( a ) { return !$.trim("" + a.value); },
	// http://docs.jquery.com/Plugins/Validation/filled
	filled: function( a ) { return !!$.trim("" + a.value); },
	// http://docs.jquery.com/Plugins/Validation/unchecked
	unchecked: function( a ) { return !a.checked; }
});

// constructor for validator
$.validator = function( options, form ) {
	this.settings = $.extend( true, {}, $.validator.defaults, options );
	this.currentForm = form;
	this.init();
};

$.validator.format = function( source, params ) {
	if ( arguments.length === 1 ) {
		return function() {
			var args = $.makeArray(arguments);
			args.unshift(source);
			return $.validator.format.apply( this, args );
		};
	}
	if ( arguments.length > 2 && params.constructor !== Array  ) {
		params = $.makeArray(arguments).slice(1);
	}
	if ( params.constructor !== Array ) {
		params = [ params ];
	}
	$.each(params, function( i, n ) {
		source = source.replace( new RegExp("\\{" + i + "\\}", "g"), function() {
			return n;
		});
	});
	return source;
};

$.extend($.validator, {

	defaults: {
		messages: {},
		groups: {},
		rules: {},
		errorClass: "error",
		validClass: "valid",
		errorElement: "label",
		focusInvalid: true,
		errorContainer: $([]),
		errorLabelContainer: $([]),
		onsubmit: true,
		ignore: ":hidden",
		ignoreTitle: false,
		onfocusin: function( element, event ) {
			this.lastActive = element;

			// hide error label and remove error class on focus if enabled
			if ( this.settings.focusCleanup && !this.blockFocusCleanup ) {
				if ( this.settings.unhighlight ) {
					this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
				}
				this.addWrapper(this.errorsFor(element)).hide();
			}
		},
		onfocusout: function( element, event ) {
			if ( !this.checkable(element) && (element.name in this.submitted || !this.optional(element)) ) {
				this.element(element);
			}
		},
		onkeyup: function( element, event ) {
			if ( event.which === 9 && this.elementValue(element) === "" ) {
				return;
			} else if ( element.name in this.submitted || element === this.lastElement ) {
				this.element(element);
			}
		},
		onclick: function( element, event ) {
			// click on selects, radiobuttons and checkboxes
			if ( element.name in this.submitted ) {
				this.element(element);
			}
			// or option elements, check parent select in that case
			else if ( element.parentNode.name in this.submitted ) {
				this.element(element.parentNode);
			}
		},
		highlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName(element.name).addClass(errorClass).removeClass(validClass);
			} else {
				$(element).addClass(errorClass).removeClass(validClass);
			}
		},
		unhighlight: function( element, errorClass, validClass ) {
			if ( element.type === "radio" ) {
				this.findByName(element.name).removeClass(errorClass).addClass(validClass);
			} else {
				$(element).removeClass(errorClass).addClass(validClass);
				// Additional statement by Venstin John Cenas
				if ($(element).next(".error:not(" + this.settings.errorElement + ")").hasClass(errorClass)) {
					$(element).next(".error:not(" + this.settings.errorElement + ")").removeClass(errorClass);
				}
			}
		}
	},

	// http://docs.jquery.com/Plugins/Validation/Validator/setDefaults
	setDefaults: function( settings ) {
		$.extend( $.validator.defaults, settings );
	},

	messages: {
		required: "This field is required.",
		remote: "Please fix this field.",
		email: "Please enter a valid email address.",
		url: "Please enter a valid URL.",
		date: "Please enter a valid date.",
		dateISO: "Please enter a valid date (ISO).",
		number: "Please enter a valid number.",
		digits: "Please enter only digits.",
		creditcard: "Please enter a valid credit card number.",
		equalTo: "Please enter the same value again.",
		maxlength: $.validator.format("Please enter no more than {0} characters."),
		minlength: $.validator.format("Please enter at least {0} characters."),
		rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
		range: $.validator.format("Please enter a value between {0} and {1}."),
		max: $.validator.format("Please enter a value less than or equal to {0}."),
		min: $.validator.format("Please enter a value greater than or equal to {0}.")
	},

	autoCreateRanges: false,

	prototype: {

		init: function() {
			this.labelContainer = $(this.settings.errorLabelContainer);
			this.errorContext = this.labelContainer.length && this.labelContainer || $(this.currentForm);
			this.containers = $(this.settings.errorContainer).add( this.settings.errorLabelContainer );
			this.submitted = {};
			this.valueCache = {};
			this.pendingRequest = 0;
			this.pending = {};
			this.invalid = {};
			this.reset();

			var groups = (this.groups = {});
			$.each(this.settings.groups, function( key, value ) {
				if ( typeof value === "string" ) {
					value = value.split(/\s/);
				}
				$.each(value, function( index, name ) {
					groups[name] = key;
				});
			});
			var rules = this.settings.rules;
			$.each(rules, function( key, value ) {
				rules[key] = $.validator.normalizeRule(value);
			});

			function delegate(event) {
				var validator = $.data(this[0].form, "validator"),
					eventType = "on" + event.type.replace(/^validate/, "");
				if ( validator.settings[eventType] ) {
					validator.settings[eventType].call(validator, this[0], event);
				}
			}
			$(this.currentForm)
				.validateDelegate(":text, [type='password'], [type='file'], select, textarea, " +
					"[type='number'], [type='search'] ,[type='tel'], [type='url'], " +
					"[type='email'], [type='datetime'], [type='date'], [type='month'], " +
					"[type='week'], [type='time'], [type='datetime-local'], " +
					"[type='range'], [type='color'] ",
					"focusin focusout keyup", delegate)
				.validateDelegate("[type='radio'], [type='checkbox'], select, option", "click", delegate);

			if ( this.settings.invalidHandler ) {
				$(this.currentForm).bind("invalid-form.validate", this.settings.invalidHandler);
			}
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/form
		form: function() {
			this.checkForm();
			$.extend(this.submitted, this.errorMap);
			this.invalid = $.extend({}, this.errorMap);
			if ( !this.valid() ) {
				$(this.currentForm).triggerHandler("invalid-form", [this]);
			}
			this.showErrors();
			return this.valid();
		},

		checkForm: function() {
			// this.prepareForm();
			// for ( var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++ ) {
				// this.check( elements[i] );
			// }
			// return this.valid();
			
			this.prepareForm();
            for ( var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++ ) {
                var checkingElements = this.findByName( elements[i].name ).not(this.settings.ignore);
                if (checkingElements.length !== undefined && checkingElements.length > 1) {
                    for (var cnt = 0; cnt < checkingElements.length; cnt++) {
                        this.check( checkingElements[cnt] );
                    }
                } else {
                    this.check( elements[i] );
                }
            }
			
            return this.valid();
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/element
		element: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );
			this.lastElement = element;
			this.prepareElement( element );
			this.currentElements = $(element);
			var result = this.check( element ) !== false;
			if ( result ) {
				delete this.invalid[element.name];
			} else {
				this.invalid[element.name] = true;
			}
			if ( !this.numberOfInvalids() ) {
				// Hide error containers on last error
				this.toHide = this.toHide.add( this.containers );
			}
			this.showErrors();
			return result;
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/showErrors
		showErrors: function( errors ) {
			if ( errors ) {
				// add items to error list and map
				$.extend( this.errorMap, errors );
				this.errorList = [];
				for ( var name in errors ) {
					this.errorList.push({
						message: errors[name],
						element: this.findByName(name)[0]
					});
				}
				// remove items from success list
				this.successList = $.grep( this.successList, function( element ) {
					return !(element.name in errors);
				});
			}
			if ( this.settings.showErrors ) {
				this.settings.showErrors.call( this, this.errorMap, this.errorList );
			} else {
				this.defaultShowErrors();
			}
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/resetForm
		resetForm: function() {
			if ( $.fn.resetForm ) {
				$(this.currentForm).resetForm();
			}
			this.submitted = {};
			this.lastElement = null;
			this.prepareForm();
			this.hideErrors();
			this.elements().removeClass( this.settings.errorClass ).removeData( "previousValue" );
		},

		numberOfInvalids: function() {
			return this.objectLength(this.invalid);
		},

		objectLength: function( obj ) {
			var count = 0;
			for ( var i in obj ) {
				count++;
			}
			return count;
		},

		hideErrors: function() {
			this.addWrapper( this.toHide ).hide();
		},

		valid: function() {
			return this.size() === 0;
		},

		size: function() {
			return this.errorList.length;
		},

		focusInvalid: function() {
			if ( this.settings.focusInvalid ) {
				try {
					$(this.findLastActive() || this.errorList.length && this.errorList[0].element || [])
					.filter(":visible")
					.focus()
					// manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
					.trigger("focusin");
				} catch(e) {
					// ignore IE throwing errors when focusing hidden elements
				}
			}
		},

		findLastActive: function() {
			var lastActive = this.lastActive;
			return lastActive && $.grep(this.errorList, function( n ) {
				return n.element.name === lastActive.name;
			}).length === 1 && lastActive;
		},

		elements: function() {
			var validator = this,
				rulesCache = {};

			// select all valid inputs inside the form (no submit or reset buttons)
			return $(this.currentForm)
			.find("input, select, textarea")
			.not(":submit, :reset, :image, [disabled]")
			.not( this.settings.ignore )
			.filter(function() {
				if ( !this.name && validator.settings.debug && window.console ) {
					console.error( "%o has no name assigned", this);
				}

				// select only the first element for each name, and only those with rules specified
				if ( this.name in rulesCache || !validator.objectLength($(this).rules()) ) {
					return false;
				}

				rulesCache[this.name] = true;
				return true;
			});
		},

		clean: function( selector ) {
			return $(selector)[0];
		},

		errors: function() {
			var errorClass = this.settings.errorClass.replace(" ", ".");
			return $(this.settings.errorElement + "." + errorClass, this.errorContext);
		},

		reset: function() {
			this.successList = [];
			this.errorList = [];
			this.errorMap = {};
			this.toShow = $([]);
			this.toHide = $([]);
			this.currentElements = $([]);
		},

		prepareForm: function() {
			this.reset();
			this.toHide = this.errors().add( this.containers );
		},

		prepareElement: function( element ) {
			this.reset();
			this.toHide = this.errorsFor(element);
		},

		elementValue: function( element ) {
			var type = $(element).attr("type"),
				val = $(element).val();

			if ( type === "radio" || type === "checkbox" ) {
				return $("input[name='" + $(element).attr("name") + "']:checked").val();
			}

			if ( typeof val === "string" ) {
				return val.replace(/\r/g, "");
			}
			return val;
		},

		check: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );

			var rules = $(element).rules();
			var dependencyMismatch = false;
			var val = this.elementValue(element);
			var result;

			for (var method in rules ) {
				var rule = { method: method, parameters: rules[method] };
				try {

					result = $.validator.methods[method].call( this, val, element, rule.parameters );

					// if a method indicates that the field is optional and therefore valid,
					// don't mark it as valid when there are no other rules
					if ( result === "dependency-mismatch" ) {
						dependencyMismatch = true;
						continue;
					}
					dependencyMismatch = false;

					if ( result === "pending" ) {
						this.toHide = this.toHide.not( this.errorsFor(element) );
						return;
					}

					if ( !result ) {
						this.formatAndAdd( element, rule );
						return false;
					}
				} catch(e) {
					if ( this.settings.debug && window.console ) {
						console.log( "Exception occured when checking element " + element.id + ", check the '" + rule.method + "' method.", e );
					}
					throw e;
				}
			}
			if ( dependencyMismatch ) {
				return;
			}
			if ( this.objectLength(rules) ) {
				this.successList.push(element);
			}
			return true;
		},

		// return the custom message for the given element and validation method
		// specified in the element's HTML5 data attribute
		customDataMessage: function( element, method ) {
			return $(element).data("msg-" + method.toLowerCase()) || (element.attributes && $(element).attr("data-msg-" + method.toLowerCase()));
		},

		// return the custom message for the given element name and validation method
		customMessage: function( name, method ) {
			var m = this.settings.messages[name];
			return m && (m.constructor === String ? m : m[method]);
		},

		// return the first defined argument, allowing empty strings
		findDefined: function() {
			for(var i = 0; i < arguments.length; i++) {
				if ( arguments[i] !== undefined ) {
					return arguments[i];
				}
			}
			return undefined;
		},

		defaultMessage: function( element, method ) {
			return this.findDefined(
				this.customMessage( element.name, method ),
				this.customDataMessage( element, method ),
				// title is never undefined, so handle empty string as undefined
				!this.settings.ignoreTitle && element.title || undefined,
				$.validator.messages[method],
				"<strong>Warning: No message defined for " + element.name + "</strong>"
			);
		},

		formatAndAdd: function( element, rule ) {
			var message = this.defaultMessage( element, rule.method ),
				theregex = /\$?\{(\d+)\}/g;
			if ( typeof message === "function" ) {
				message = message.call(this, rule.parameters, element);
			} else if (theregex.test(message)) {
				message = $.validator.format(message.replace(theregex, "{$1}"), rule.parameters);
			}
			this.errorList.push({
				message: message,
				element: element
			});

			this.errorMap[element.name] = message;
			this.submitted[element.name] = message;
		},

		addWrapper: function( toToggle ) {
			if ( this.settings.wrapper ) {
				toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
			}
			return toToggle;
		},

		defaultShowErrors: function() {
			var i, elements;
			for ( i = 0; this.errorList[i]; i++ ) {
				var error = this.errorList[i];
				if ( this.settings.highlight ) {
					this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
				}
				this.showLabel( error.element, error.message );
			}
			if ( this.errorList.length ) {
				this.toShow = this.toShow.add( this.containers );
			}
			if ( this.settings.success ) {
				for ( i = 0; this.successList[i]; i++ ) {
					this.showLabel( this.successList[i] );
				}
			}
			if ( this.settings.unhighlight ) {
				for ( i = 0, elements = this.validElements(); elements[i]; i++ ) {
					this.settings.unhighlight.call( this, elements[i], this.settings.errorClass, this.settings.validClass );
				}
			}
			this.toHide = this.toHide.not( this.toShow );
			this.hideErrors();
			this.addWrapper( this.toShow ).show();
		},

		validElements: function() {
			return this.currentElements.not(this.invalidElements());
		},

		invalidElements: function() {
			return $(this.errorList).map(function() {
				return this.element;
			});
		},

		showLabel: function( element, message ) {
			var label = this.errorsFor( element );
			if ( label.length ) {
				// refresh error/success class
				label.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );
				// replace message on existing label
				label.html(message);
			} else {
				// create label
				label = $("<" + this.settings.errorElement + ">")
					.attr("for", this.idOrName(element))
					.addClass(this.settings.errorClass)
					.html(message || "");
				if ( this.settings.wrapper ) {
					// make sure the element is visible, even in IE
					// actually showing the wrapped element is handled elsewhere
					label = label.hide().show().wrap("<" + this.settings.wrapper + "/>").parent();
				}
				if ( !this.labelContainer.append(label).length ) {
					if ( this.settings.errorPlacement ) {
						this.settings.errorPlacement(label, $(element) );
					} else {
						var elementappend = $(element).attr("name");
						// Modified By: Venstin John Cenas
						// Default : label.insertAfter(element);
						
						if (($(element).parents("form").find("[error='" + elementappend + "']").length > 0)) {
							$(element).parents("form").find("[error='" + elementappend + "']").append(label);
						} else {
							if ($(element).next().hasClass('chzn-container')) {
								label.insertAfter($(element).next());
								$(label).prev().addClass("error");
							} else if ($(element).next().hasClass('tagsinput')) {
								label.insertAfter($(element).next());
								$(label).prev().addClass("error");
							} else {
								label.insertAfter(element);
							}						
						}
					}
				}
			}
			if ( !message && this.settings.success ) {
				label.text("");
				if ( typeof this.settings.success === "string" ) {
					label.addClass( this.settings.success );
				} else {
					this.settings.success( label, element );
				}
			}
			this.toShow = this.toShow.add(label);
		},

		errorsFor: function( element ) {
			var name = this.idOrName(element);
			return this.errors().filter(function() {
				return $(this).attr("for") === name;
			});
		},

		idOrName: function( element ) {
			return this.groups[element.name] || (this.checkable(element) ? element.name : element.id || element.name);
		},

		validationTargetFor: function( element ) {
			// if radio/checkbox, validate first element in group instead
			if ( this.checkable(element) ) {
				element = this.findByName( element.name ).not(this.settings.ignore)[0];
			}
			return element;
		},

		checkable: function( element ) {
			return (/radio|checkbox/i).test(element.type);
		},

		findByName: function( name ) {
			return $(this.currentForm).find("[name='" + name + "']");
		},

		getLength: function( value, element ) {
			switch( element.nodeName.toLowerCase() ) {
			case "select":
				return $("option:selected", element).length;
			case "input":
				if ( this.checkable( element) ) {
					return this.findByName(element.name).filter(":checked").length;
				}
			}
			return value.length;
		},

		depend: function( param, element ) {
			return this.dependTypes[typeof param] ? this.dependTypes[typeof param](param, element) : true;
		},

		dependTypes: {
			"boolean": function( param, element ) {
				return param;
			},
			"string": function( param, element ) {
				return !!$(param, element.form).length;
			},
			"function": function( param, element ) {
				return param(element);
			}
		},

		optional: function( element ) {
			var val = this.elementValue(element);
			return !$.validator.methods.required.call(this, val, element) && "dependency-mismatch";
		},

		startRequest: function( element ) {
			if ( !this.pending[element.name] ) {
				this.pendingRequest++;
				this.pending[element.name] = true;
			}
		},

		stopRequest: function( element, valid ) {
			this.pendingRequest--;
			// sometimes synchronization fails, make sure pendingRequest is never < 0
			if ( this.pendingRequest < 0 ) {
				this.pendingRequest = 0;
			}
			delete this.pending[element.name];
			if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() ) {
				$(this.currentForm).submit();
				this.formSubmitted = false;
			} else if (!valid && this.pendingRequest === 0 && this.formSubmitted) {
				$(this.currentForm).triggerHandler("invalid-form", [this]);
				this.formSubmitted = false;
			}
		},

		previousValue: function( element ) {
			return $.data(element, "previousValue") || $.data(element, "previousValue", {
				old: null,
				valid: true,
				message: this.defaultMessage( element, "remote" )
			});
		}

	},

	classRuleSettings: {
		required: {required: true},
		email: {email: true},
		url: {url: true},
		date: {date: true},
		dateISO: {dateISO: true},
		number: {number: true},
		digits: {digits: true},
		creditcard: {creditcard: true}
	},

	addClassRules: function( className, rules ) {
		if ( className.constructor === String ) {
			this.classRuleSettings[className] = rules;
		} else {
			$.extend(this.classRuleSettings, className);
		}
	},

	classRules: function( element ) {
		var rules = {};
		var classes = $(element).attr("class");
		if ( classes ) {
			$.each(classes.split(" "), function() {
				if ( this in $.validator.classRuleSettings ) {
					$.extend(rules, $.validator.classRuleSettings[this]);
				}
			});
		}
		return rules;
	},

	attributeRules: function( element ) {
		var rules = {};
		var $element = $(element);

		for (var method in $.validator.methods) {
			var value;

			// support for <input required> in both html5 and older browsers
			if ( method === "required" ) {
				value = $element.get(0).getAttribute(method);
				// Some browsers return an empty string for the required attribute
				// and non-HTML5 browsers might have required="" markup
				if ( value === "" ) {
					value = true;
				}
				// force non-HTML5 browsers to return bool
				value = !!value;
			} else {
				value = $element.attr(method);
			}

			if ( value ) {
				rules[method] = value;
			} else if ( $element[0].getAttribute("type") === method ) {
				rules[method] = true;
			}
		}

		// maxlength may be returned as -1, 2147483647 (IE) and 524288 (safari) for text inputs
		if ( rules.maxlength && /-1|2147483647|524288/.test(rules.maxlength) ) {
			delete rules.maxlength;
		}

		return rules;
	},

	dataRules: function( element ) {
		var method, value,
			rules = {}, $element = $(element);
		for (method in $.validator.methods) {
			value = $element.data("rule-" + method.toLowerCase());
			if ( value !== undefined ) {
				rules[method] = value;
			}
		}
		return rules;
	},

	staticRules: function( element ) {
		var rules = {};
		var validator = $.data(element.form, "validator");
		if ( validator.settings.rules ) {
			rules = $.validator.normalizeRule(validator.settings.rules[element.name]) || {};
		}
		return rules;
	},

	normalizeRules: function( rules, element ) {
		// handle dependency check
		$.each(rules, function( prop, val ) {
			// ignore rule when param is explicitly false, eg. required:false
			if ( val === false ) {
				delete rules[prop];
				return;
			}
			if ( val.param || val.depends ) {
				var keepRule = true;
				switch (typeof val.depends) {
				case "string":
					keepRule = !!$(val.depends, element.form).length;
					break;
				case "function":
					keepRule = val.depends.call(element, element);
					break;
				}
				if ( keepRule ) {
					rules[prop] = val.param !== undefined ? val.param : true;
				} else {
					delete rules[prop];
				}
			}
		});

		// evaluate parameters
		$.each(rules, function( rule, parameter ) {
			rules[rule] = $.isFunction(parameter) ? parameter(element) : parameter;
		});

		// clean number parameters
		$.each(['minlength', 'maxlength'], function() {
			if ( rules[this] ) {
				rules[this] = Number(rules[this]);
			}
		});
		$.each(['rangelength'], function() {
			var parts;
			if ( rules[this] ) {
				if ( $.isArray(rules[this]) ) {
					rules[this] = [Number(rules[this][0]), Number(rules[this][1])];
				} else if ( typeof rules[this] === "string" ) {
					parts = rules[this].split(/[\s,]+/);
					rules[this] = [Number(parts[0]), Number(parts[1])];
				}
			}
		});

		if ( $.validator.autoCreateRanges ) {
			// auto-create ranges
			if ( rules.min && rules.max ) {
				rules.range = [rules.min, rules.max];
				delete rules.min;
				delete rules.max;
			}
			if ( rules.minlength && rules.maxlength ) {
				rules.rangelength = [rules.minlength, rules.maxlength];
				delete rules.minlength;
				delete rules.maxlength;
			}
		}

		return rules;
	},

	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	normalizeRule: function( data ) {
		if ( typeof data === "string" ) {
			var transformed = {};
			$.each(data.split(/\s/), function() {
				transformed[this] = true;
			});
			data = transformed;
		}
		return data;
	},

	// http://docs.jquery.com/Plugins/Validation/Validator/addMethod
	addMethod: function( name, method, message ) {
		$.validator.methods[name] = method;
		$.validator.messages[name] = message !== undefined ? message : $.validator.messages[name];
		if ( method.length < 3 ) {
			$.validator.addClassRules(name, $.validator.normalizeRule(name));
		}
	},

	methods: {

		// http://docs.jquery.com/Plugins/Validation/Methods/required
		required: function( value, element, param ) {
			// check if dependency is met
			if ( !this.depend(param, element) ) {
				return "dependency-mismatch";
			}
			if ( element.nodeName.toLowerCase() === "select" ) {
				// could be an array for select-multiple or a string, both are fine this way
				var val = $(element).val();
				return val && val.length > 0;
			}
			if ( this.checkable(element) ) {
				return this.getLength(value, element) > 0;
			}
			return $.trim(value).length > 0;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/remote
		remote: function( value, element, param ) {
			if ( this.optional(element) ) {
				return "dependency-mismatch";
			}

			var previous = this.previousValue(element);
			if (!this.settings.messages[element.name] ) {
				this.settings.messages[element.name] = {};
			}
			previous.originalMessage = this.settings.messages[element.name].remote;
			this.settings.messages[element.name].remote = previous.message;

			param = typeof param === "string" && {url:param} || param;

			if ( previous.old === value ) {
				return previous.valid;
			}

			previous.old = value;
			var validator = this;
			this.startRequest(element);
			var data = {};
			data[element.name] = value;
			$.ajax($.extend(true, {
				url: param,
				mode: "abort",
				port: "validate" + element.name,
				dataType: "json",
				data: data,
				success: function( response ) {
					validator.settings.messages[element.name].remote = previous.originalMessage;
					var valid = response === true || response === "true";
					if ( valid ) {
						var submitted = validator.formSubmitted;
						validator.prepareElement(element);
						validator.formSubmitted = submitted;
						validator.successList.push(element);
						delete validator.invalid[element.name];
						validator.showErrors();
					} else {
						var errors = {};
						var message = response || validator.defaultMessage( element, "remote" );
						errors[element.name] = previous.message = $.isFunction(message) ? message(value) : message;
						validator.invalid[element.name] = true;
						validator.showErrors(errors);
					}
					previous.valid = valid;
					validator.stopRequest(element, valid);
				}
			}, param));
			return "pending";
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/minlength
		minlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
			return this.optional(element) || length >= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/maxlength
		maxlength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
			return this.optional(element) || length <= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/rangelength
		rangelength: function( value, element, param ) {
			var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
			return this.optional(element) || ( length >= param[0] && length <= param[1] );
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/min
		min: function( value, element, param ) {
			return this.optional(element) || value >= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/max
		max: function( value, element, param ) {
			return this.optional(element) || value <= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/range
		range: function( value, element, param ) {
			return this.optional(element) || ( value >= param[0] && value <= param[1] );
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/email
		email: function( value, element ) {
			// contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
			return this.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/url
		url: function( value, element ) {
			// contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
			return this.optional(element) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/date
		date: function( value, element ) {
			return this.optional(element) || !/Invalid|NaN/.test(new Date(value).toString());
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/dateISO
		dateISO: function( value, element ) {
			return this.optional(element) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/number
		number: function( value, element ) {
			return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/digits
		digits: function( value, element ) {
			return this.optional(element) || /^\d+$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/creditcard
		// based on http://en.wikipedia.org/wiki/Luhn
		creditcard: function( value, element ) {
			if ( this.optional(element) ) {
				return "dependency-mismatch";
			}
			// accept only spaces, digits and dashes
			if ( /[^0-9 \-]+/.test(value) ) {
				return false;
			}
			var nCheck = 0,
				nDigit = 0,
				bEven = false;

			value = value.replace(/\D/g, "");

			for (var n = value.length - 1; n >= 0; n--) {
				var cDigit = value.charAt(n);
				nDigit = parseInt(cDigit, 10);
				if ( bEven ) {
					if ( (nDigit *= 2) > 9 ) {
						nDigit -= 9;
					}
				}
				nCheck += nDigit;
				bEven = !bEven;
			}

			return (nCheck % 10) === 0;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/equalTo
		equalTo: function( value, element, param ) {
			// bind to the blur event of the target in order to revalidate whenever the target field is updated
			// TODO find a way to bind the event just once, avoiding the unbind-rebind overhead
			var target = $(param);
			if ( this.settings.onfocusout ) {
				target.unbind(".validate-equalTo").bind("blur.validate-equalTo", function() {
					$(element).valid();
				});
			}
			return value === target.val();
		}

	}

});

// deprecated, use $.validator.format instead
$.format = $.validator.format;

}(jQuery));

// ajax mode: abort
// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()
(function($) {
	var pendingRequests = {};
	// Use a prefilter if available (1.5+)
	if ( $.ajaxPrefilter ) {
		$.ajaxPrefilter(function( settings, _, xhr ) {
			var port = settings.port;
			if ( settings.mode === "abort" ) {
				if ( pendingRequests[port] ) {
					pendingRequests[port].abort();
				}
				pendingRequests[port] = xhr;
			}
		});
	} else {
		// Proxy ajax
		var ajax = $.ajax;
		$.ajax = function( settings ) {
			var mode = ( "mode" in settings ? settings : $.ajaxSettings ).mode,
				port = ( "port" in settings ? settings : $.ajaxSettings ).port;
			if ( mode === "abort" ) {
				if ( pendingRequests[port] ) {
					pendingRequests[port].abort();
				}
				return (pendingRequests[port] = ajax.apply(this, arguments));
			}
			return ajax.apply(this, arguments);
		};
	}
}(jQuery));

// provides delegate(type: String, delegate: Selector, handler: Callback) plugin for easier event delegation
// handler is only called when $(event.target).is(delegate), in the scope of the jquery-object for event.target
(function($) {
	$.extend($.fn, {
		validateDelegate: function( delegate, type, handler ) {
			return this.bind(type, function( event ) {
				var target = $(event.target);
				if ( target.is(delegate) ) {
					return handler.apply(target, arguments);
				}
			});
		}
	});
}(jQuery));

/*! jQuery Validation Plugin - v1.11.0 - 2/4/2013
* https://github.com/jzaefferer/jquery-validation
* Copyright (c) 2013 JÃ¶rn Zaefferer; Licensed MIT */

/*!
 * jQuery Validation Plugin 1.11.0
 *
 * http://bassistance.de/jquery-plugins/jquery-plugin-validation/
 * http://docs.jquery.com/Plugins/Validation
 *
 * Copyright 2013 JÃ¶rn Zaefferer
 * Released under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 */

(function() {

	function stripHtml(value) {
		// remove html tags and space chars
		return value.replace(/<.[^<>]*?>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ')
		// remove punctuation
		.replace(/[.(),;:!?%#$'"_+=\/\-]*/g,'');
	}
	jQuery.validator.addMethod("maxWords", function(value, element, params) {
		return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length <= params;
	}, jQuery.validator.format("Please enter {0} words or less."));

	jQuery.validator.addMethod("minWords", function(value, element, params) {
		return this.optional(element) || stripHtml(value).match(/\b\w+\b/g).length >= params;
	}, jQuery.validator.format("Please enter at least {0} words."));

	jQuery.validator.addMethod("rangeWords", function(value, element, params) {
		var valueStripped = stripHtml(value);
		var regex = /\b\w+\b/g;
		return this.optional(element) || valueStripped.match(regex).length >= params[0] && valueStripped.match(regex).length <= params[1];
	}, jQuery.validator.format("Please enter between {0} and {1} words."));

}());

jQuery.validator.addMethod("letterswithbasicpunc", function(value, element) {
	return this.optional(element) || /^[a-z\-.,()'"\s]+$/i.test(value);
}, "Letters or punctuation only please");

jQuery.validator.addMethod("alphanumeric", function(value, element) {
	return this.optional(element) || /^\w+$/i.test(value);
}, "Letters, numbers, and underscores only please");

jQuery.validator.addMethod("lettersonly", function(value, element) {
	return this.optional(element) || /^[a-z]+$/i.test(value);
}, "Letters only please");

jQuery.validator.addMethod("nowhitespace", function(value, element) {
	return this.optional(element) || /^\S+$/i.test(value);
}, "No white space please");

jQuery.validator.addMethod("ziprange", function(value, element) {
	return this.optional(element) || /^90[2-5]\d\{2\}-\d{4}$/.test(value);
}, "Your ZIP-code must be in the range 902xx-xxxx to 905-xx-xxxx");

jQuery.validator.addMethod("zipcodeUS", function(value, element) {
	return this.optional(element) || /\d{5}-\d{4}$|^\d{5}$/.test(value);
}, "The specified US ZIP Code is invalid");

jQuery.validator.addMethod("integer", function(value, element) {
	return this.optional(element) || /^-?\d+$/.test(value);
}, "A positive or negative non-decimal number please");

/**
 * Return true, if the value is a valid vehicle identification number (VIN).
 *
 * Works with all kind of text inputs.
 *
 * @example <input type="text" size="20" name="VehicleID" class="{required:true,vinUS:true}" />
 * @desc Declares a required input element whose value must be a valid vehicle identification number.
 *
 * @name jQuery.validator.methods.vinUS
 * @type Boolean
 * @cat Plugins/Validate/Methods
 */
jQuery.validator.addMethod("vinUS", function(v) {
	if (v.length !== 17) {
		return false;
	}
	var i, n, d, f, cd, cdv;
	var LL = ["A","B","C","D","E","F","G","H","J","K","L","M","N","P","R","S","T","U","V","W","X","Y","Z"];
	var VL = [1,2,3,4,5,6,7,8,1,2,3,4,5,7,9,2,3,4,5,6,7,8,9];
	var FL = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
	var rs = 0;
	for(i = 0; i < 17; i++){
		f = FL[i];
		d = v.slice(i,i+1);
		if (i === 8) {
			cdv = d;
		}
		if (!isNaN(d)) {
			d *= f;
		} else {
			for (n = 0; n < LL.length; n++) {
				if (d.toUpperCase() === LL[n]) {
					d = VL[n];
					d *= f;
					if (isNaN(cdv) && n === 8) {
						cdv = LL[n];
					}
					break;
				}
			}
		}
		rs += d;
	}
	cd = rs % 11;
	if (cd === 10) {
		cd = "X";
	}
	if (cd === cdv) {
		return true;
	}
	return false;
}, "The specified vehicle identification number (VIN) is invalid.");

/**
 * Return true, if the value is a valid date, also making this formal check dd/mm/yyyy.
 *
 * @example jQuery.validator.methods.date("01/01/1900")
 * @result true
 *
 * @example jQuery.validator.methods.date("01/13/1990")
 * @result false
 *
 * @example jQuery.validator.methods.date("01.01.1900")
 * @result false
 *
 * @example <input name="pippo" class="{dateITA:true}" />
 * @desc Declares an optional input element whose value must be a valid date.
 *
 * @name jQuery.validator.methods.dateITA
 * @type Boolean
 * @cat Plugins/Validate/Methods
 */
jQuery.validator.addMethod("dateITA", function(value, element) {
	var check = false;
	var re = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
	if( re.test(value)) {
		var adata = value.split('/');
		var gg = parseInt(adata[0],10);
		var mm = parseInt(adata[1],10);
		var aaaa = parseInt(adata[2],10);
		var xdata = new Date(aaaa,mm-1,gg);
		if ( ( xdata.getFullYear() === aaaa ) && ( xdata.getMonth() === mm - 1 ) && ( xdata.getDate() === gg ) ){
			check = true;
		} else {
			check = false;
		}
	} else {
		check = false;
	}
	return this.optional(element) || check;
}, "Please enter a correct date");

jQuery.validator.addMethod("dateNL", function(value, element) {
	return this.optional(element) || /^(0?[1-9]|[12]\d|3[01])[\.\/\-](0?[1-9]|1[012])[\.\/\-]([12]\d)?(\d\d)$/.test(value);
}, "Vul hier een geldige datum in.");

jQuery.validator.addMethod("time", function(value, element) {
	return this.optional(element) || /^([01]\d|2[0-3])(:[0-5]\d){1,2}$/.test(value);
}, "Please enter a valid time, between 00:00 and 23:59");
jQuery.validator.addMethod("time12h", function(value, element) {
	return this.optional(element) || /^((0?[1-9]|1[012])(:[0-5]\d){1,2}( ?[AP]M))$/i.test(value);
}, "Please enter a valid time in 12-hour format");

/**
 * matches US phone number format
 *
 * where the area code may not start with 1 and the prefix may not start with 1
 * allows '-' or ' ' as a separator and allows parens around area code
 * some people may want to put a '1' in front of their number
 *
 * 1(212)-999-2345 or
 * 212 999 2344 or
 * 212-999-0983
 *
 * but not
 * 111-123-5434
 * and not
 * 212 123 4567
 */
jQuery.validator.addMethod("phoneUS", function(phone_number, element) {
	phone_number = phone_number.replace(/\s+/g, "");
	return this.optional(element) || phone_number.length > 9 &&
		phone_number.match(/^(\+?1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
}, "Please specify a valid phone number");

jQuery.validator.addMethod('phoneUK', function(phone_number, element) {
	phone_number = phone_number.replace(/\(|\)|\s+|-/g,'');
	return this.optional(element) || phone_number.length > 9 &&
		phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?)|(?:\(?0))(?:(?:\d{5}\)?\s?\d{4,5})|(?:\d{4}\)?\s?(?:\d{5}|\d{3}\s?\d{3}))|(?:\d{3}\)?\s?\d{3}\s?\d{3,4})|(?:\d{2}\)?\s?\d{4}\s?\d{4}))$/);
}, 'Please specify a valid phone number');

jQuery.validator.addMethod('mobileUK', function(phone_number, element) {
	phone_number = phone_number.replace(/\s+|-/g,'');
	return this.optional(element) || phone_number.length > 9 &&
		phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?|0)7(?:[45789]\d{2}|624)\s?\d{3}\s?\d{3})$/);
}, 'Please specify a valid mobile number');

//Matches UK landline + mobile, accepting only 01-3 for landline or 07 for mobile to exclude many premium numbers
jQuery.validator.addMethod('phonesUK', function(phone_number, element) {
	phone_number = phone_number.replace(/\s+|-/g,'');
	return this.optional(element) || phone_number.length > 9 &&
		phone_number.match(/^(?:(?:(?:00\s?|\+)44\s?|0)(?:1\d{8,9}|[23]\d{9}|7(?:[45789]\d{8}|624\d{6})))$/);
}, 'Please specify a valid uk phone number');
// On the above three UK functions, do the following server side processing:
//  Compare with ^((?:00\s?|\+)(44)\s?)?\(?0?(?:\)\s?)?([1-9]\d{1,4}\)?[\d\s]+)
//  Extract $2 and set $prefix to '+44<space>' if $2 is '44' otherwise set $prefix to '0'
//  Extract $3 and remove spaces and parentheses. Phone number is combined $2 and $3.
// A number of very detailed GB telephone number RegEx patterns can also be found at:
// http://www.aa-asterisk.org.uk/index.php/Regular_Expressions_for_Validating_and_Formatting_UK_Telephone_Numbers

//Matches UK postcode. based on http://snipplr.com/view/3152/postcode-validation/
jQuery.validator.addMethod('postcodeUK', function(postcode, element) {
	postcode = (postcode.toUpperCase()).replace(/\s+/g,'');
	return this.optional(element) || postcode.match(/^([^QZ][^IJZ]{0,1}\d{1,2})(\d[^CIKMOV]{2})$/) || postcode.match(/^([^QV]\d[ABCDEFGHJKSTUW])(\d[^CIKMOV]{2})$/) || postcode.match(/^([^QV][^IJZ]\d[ABEHMNPRVWXY])(\d[^CIKMOV]{2})$/) || postcode.match(/^(GIR)(0AA)$/) || postcode.match(/^(BFPO)(\d{1,4})$/) || postcode.match(/^(BFPO)(C\/O\d{1,3})$/);
}, 'Please specify a valid postcode');

// TODO check if value starts with <, otherwise don't try stripping anything
jQuery.validator.addMethod("strippedminlength", function(value, element, param) {
	return jQuery(value).text().length >= param;
}, jQuery.validator.format("Please enter at least {0} characters"));

// same as email, but TLD is optional
jQuery.validator.addMethod("email2", function(value, element, param) {
	return this.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value);
}, jQuery.validator.messages.email);

// same as url, but TLD is optional
jQuery.validator.addMethod("url2", function(value, element, param) {
	return this.optional(element) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)*(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
}, jQuery.validator.messages.url);

// NOTICE: Modified version of Castle.Components.Validator.CreditCardValidator
// Redistributed under the the Apache License 2.0 at http://www.apache.org/licenses/LICENSE-2.0
// Valid Types: mastercard, visa, amex, dinersclub, enroute, discover, jcb, unknown, all (overrides all other settings)
jQuery.validator.addMethod("creditcardtypes", function(value, element, param) {
	if (/[^0-9\-]+/.test(value)) {
		return false;
	}

	value = value.replace(/\D/g, "");

	var validTypes = 0x0000;

	if (param.mastercard) {
		validTypes |= 0x0001;
	}
	if (param.visa) {
		validTypes |= 0x0002;
	}
	if (param.amex) {
		validTypes |= 0x0004;
	}
	if (param.dinersclub) {
		validTypes |= 0x0008;
	}
	if (param.enroute) {
		validTypes |= 0x0010;
	}
	if (param.discover) {
		validTypes |= 0x0020;
	}
	if (param.jcb) {
		validTypes |= 0x0040;
	}
	if (param.unknown) {
		validTypes |= 0x0080;
	}
	if (param.all) {
		validTypes = 0x0001 | 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0020 | 0x0040 | 0x0080;
	}
	if (validTypes & 0x0001 && /^(5[12345])/.test(value)) { //mastercard
		return value.length === 16;
	}
	if (validTypes & 0x0002 && /^(4)/.test(value)) { //visa
		return value.length === 16;
	}
	if (validTypes & 0x0004 && /^(3[47])/.test(value)) { //amex
		return value.length === 15;
	}
	if (validTypes & 0x0008 && /^(3(0[012345]|[68]))/.test(value)) { //dinersclub
		return value.length === 14;
	}
	if (validTypes & 0x0010 && /^(2(014|149))/.test(value)) { //enroute
		return value.length === 15;
	}
	if (validTypes & 0x0020 && /^(6011)/.test(value)) { //discover
		return value.length === 16;
	}
	if (validTypes & 0x0040 && /^(3)/.test(value)) { //jcb
		return value.length === 16;
	}
	if (validTypes & 0x0040 && /^(2131|1800)/.test(value)) { //jcb
		return value.length === 15;
	}
	if (validTypes & 0x0080) { //unknown
		return true;
	}
	return false;
}, "Please enter a valid credit card number.");

jQuery.validator.addMethod("ipv4", function(value, element, param) {
	return this.optional(element) || /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i.test(value);
}, "Please enter a valid IP v4 address.");

jQuery.validator.addMethod("ipv6", function(value, element, param) {
	return this.optional(element) || /^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i.test(value);
}, "Please enter a valid IP v6 address.");

/**
* Return true if the field value matches the given format RegExp
*
* @example jQuery.validator.methods.pattern("AR1004",element,/^AR\d{4}$/)
* @result true
*
* @example jQuery.validator.methods.pattern("BR1004",element,/^AR\d{4}$/)
* @result false
*
* @name jQuery.validator.methods.pattern
* @type Boolean
* @cat Plugins/Validate/Methods
*/
jQuery.validator.addMethod("pattern", function(value, element, param) {
	if (this.optional(element)) {
		return true;
	}
	if (typeof param === 'string') {
		param = new RegExp('^(?:' + param + ')$');
	}
	return param.test(value);
}, "Invalid format.");


/*
 * Lets you say "at least X inputs that match selector Y must be filled."
 *
 * The end result is that neither of these inputs:
 *
 *  <input class="productinfo" name="partnumber">
 *  <input class="productinfo" name="description">
 *
 *  ...will validate unless at least one of them is filled.
 *
 * partnumber:  {require_from_group: [1,".productinfo"]},
 * description: {require_from_group: [1,".productinfo"]}
 *
 */
jQuery.validator.addMethod("require_from_group", function(value, element, options) {
	var validator = this;
	var selector = options[1];
	var validOrNot = $(selector, element.form).filter(function() {
		return validator.elementValue(this);
	}).length >= options[0];

	if(!$(element).data('being_validated')) {
		var fields = $(selector, element.form);
		fields.data('being_validated', true);
		fields.valid();
		fields.data('being_validated', false);
	}
	return validOrNot;
}, jQuery.format("Please fill at least {0} of these fields."));

/*
 * Lets you say "either at least X inputs that match selector Y must be filled,
 * OR they must all be skipped (left blank)."
 *
 * The end result, is that none of these inputs:
 *
 *  <input class="productinfo" name="partnumber">
 *  <input class="productinfo" name="description">
 *  <input class="productinfo" name="color">
 *
 *  ...will validate unless either at least two of them are filled,
 *  OR none of them are.
 *
 * partnumber:  {skip_or_fill_minimum: [2,".productinfo"]},
 *  description: {skip_or_fill_minimum: [2,".productinfo"]},
 * color:       {skip_or_fill_minimum: [2,".productinfo"]}
 *
 */
jQuery.validator.addMethod("skip_or_fill_minimum", function(value, element, options) {
	var validator = this;
	var numberRequired = options[0];
	var selector = options[1];
	var numberFilled = $(selector, element.form).filter(function() {
		return validator.elementValue(this);
	}).length;
	var valid = numberFilled >= numberRequired || numberFilled === 0;

	if(!$(element).data('being_validated')) {
		var fields = $(selector, element.form);
		fields.data('being_validated', true);
		fields.valid();
		fields.data('being_validated', false);
	}
	return valid;
}, jQuery.format("Please either skip these fields or fill at least {0} of them."));

// Accept a value from a file input based on a required mimetype
jQuery.validator.addMethod("accept", function(value, element, param) {
	// Split mime on commas in case we have multiple types we can accept
	var typeParam = typeof param === "string" ? param.replace(/\s/g, '').replace(/,/g, '|') : "image/*",
	optionalValue = this.optional(element),
	i, file;

	// Element is optional
	if (optionalValue) {
		return optionalValue;
	}

	if ($(element).attr("type") === "file") {
		// If we are using a wildcard, make it regex friendly
		typeParam = typeParam.replace(/\*/g, ".*");

		// Check if the element has a FileList before checking each file
		if (element.files && element.files.length) {
			for (i = 0; i < element.files.length; i++) {
				file = element.files[i];

				// Grab the mimtype from the loaded file, verify it matches
				if (!file.type.match(new RegExp( ".?(" + typeParam + ")$", "i"))) {
					return false;
				}
			}
		}
	}

	// Either return true because we've validated each file, or because the
	// browser does not support element.files and the FileList feature
	return true;
}, jQuery.format("Please enter a value with a valid mimetype."));

// Older "accept" file extension method. Old docs: http://docs.jquery.com/Plugins/Validation/Methods/accept
jQuery.validator.addMethod("extension", function(value, element, param) {
	param = typeof param === "string" ? param.replace(/,/g, '|') : "png|jpe?g|gif";
	return this.optional(element) || value.match(new RegExp(".(" + param + ")$", "i"));
}, jQuery.format("Please enter a value with a valid extension."));
