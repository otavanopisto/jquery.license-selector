(function() {
  'use strict';
  
  var CC_URL_PREFIX = "creativecommons.org/licenses/";
  var CC_ICON_PREFIX = "i.creativecommons.org/l/";
  var CC_NORMAL_ICON = "88x31.png";
  var CC_COMPACT_ICON = "80x15.png";
  var CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';
  var OGL_URL = 'http://www.wizards.com/d20/files/OGLv1.0a.rtf';
  var uniqueIdIterator = 0;
  
  $.widget("custom.licenseSelector", {
    options : {
      types: {
        'cc-4.0': {
          strategy: 'cc',
          defaultValue: 'https://creativecommons.org/licenses/by-sa/4.0',
          labelLocale: 'createCommons40Label'
        },
        'cc-3.0': {
          strategy: 'cc',
          defaultValue: 'https://creativecommons.org/licenses/by-sa/3.0',
          labelLocale: 'createCommons30Label'
        },
        'cc0-1.0': {
          strategy: 'cc0',
          defaultValue: CC0_URL,
          labelLocale: 'cc0Label'
        },
        'ogl': {
          strategy: 'ogl',
          defaultValue: OGL_URL,
          labelLocale: 'oglLabel'
        },
        'link': {
          strategy: 'url',
          defaultValue: '',
          labelLocale: 'linkLabel',
          placeholderLocale: 'linkPlaceholder'
        },
        'none': {
          strategy: 'none',
          labelLocale: 'noneLabel',
          defaultValue: ''
        }
      },
      
      locales: {
        en: {
          'createCommons30Label': 'Creative Commons 3.0', 
          'createCommons40Label': 'Creative Commons 4.0', 
          'oglLabel': 'Open Game License', 
          'linkLabel': 'Link',
          'linkPlaceholder': 'Licence URL address',
          'createCommonsDerivatives': 'Allow modifications of your work?',
          'createCommonsDerivativesYes': 'Yes',
          'createCommonsDerivativesNo': 'No',
          'createCommonsDerivativesShareAlike': 'Yes, as long as others share alike',
          'createCommonsCommercial': 'Allow commercial uses of your work?',
          'createCommonsCommercialYes': 'Yes',
          'createCommonsCommercialNo': 'No',
          'cc0Label': 'CC0 1.0 Universal',
          'noneLabel': 'No license'
        },
        fi: {
          'createCommons30Label': 'Creative Commons 3.0', 
          'createCommons40Label': 'Creative Commons 4.0', 
          'oglLabel': 'Open Game License', 
          'linkLabel': 'Linkki',
          'linkPlaceholder': 'URL-osoite lisenssiin',
          'createCommonsDerivatives': 'Sallitaanko teoksen muokkaaminen?',
          'createCommonsDerivativesYes': 'Kyllä',
          'createCommonsDerivativesNo': 'Ei',
          'createCommonsDerivativesShareAlike': 'Kyllä, mikäli muut jakavat samoin ehdoin',
          'createCommonsCommercial': 'Haluatko lisenssin koskevan myös kaupallista toimintaa?',
          'createCommonsCommercialYes': 'Kyllä',
          'createCommonsCommercialNo': 'Ei',
          'cc0Label': 'CC0 1.0 Yleismaailmallinen',
          'noneLabel': 'Ei lisenssiä'
        }
      }
    },
    
    _create : function() {
      this._name = this.element.attr('id') || (this.element.attr('name') || 'anon') + (++uniqueIdIterator);
      
      this.element.hide();
      
      this._widget = $('<div>')
        .insertBefore(this.element);
      
      var typeSelect = $('<select>')
        .addClass('type')
        .appendTo(this._widget);
      
      $.each(this.options.types, $.proxy(function (id, type) {
        if (this._supportsType(id)) {
          this._addType(id, type);
        }
      }, this));
      
      this.val(this.element.val());
      
      this._widget.on('change', 'select.type', $.proxy(this._onTypeSelectChange, this));
      this._widget.on('change', '.creative-commons-attribute', $.proxy(this._onCreativeCommonsAttributeChange, this));
    },
    
    val: function (url) {
      if (url !== undefined) {
        this.element.val(url);
        this.element.hide();
        var typeId = this._resolveType(url, this._widget.find('select.type').val());
        
        this._widget.find('.type-options').hide();
        this._widget.find('.type-options[data-type-id="' + typeId + '"]').show();
        this._widget.find('select.type').val(typeId);
        
        var placeholder = this._getPlaceholder(typeId);
        if (placeholder) {
          this.element.attr('placeholder', placeholder);
        } else {
          this.element.removeAttr('placeholder');
        }
        
        switch (this._resolveStrategy(typeId)) {
          case 'cc':
            $(this._widget).find('.type-options[data-type-id="' + typeId + '"] *[data-default="true"]').prop('checked', 'checked');
            var creativeCommons = this._parseCreativeCommons(url);
            $.each(creativeCommons.attributes, $.proxy(function (index, attribute) {
              $(this._widget).find('.type-options[data-type-id="' + typeId + '"] *[data-attribute="' + attribute + '"]').prop('checked', 'checked');
            }, this));
          break;
          case 'url':
            this.element.show();
          break;
        }
      } else {
        return this.element.val();
      }
    },
    
    _onTypeSelectChange: function (event, data) {
      var typeId = $(event.target).closest('select.type').val();
      var typeOptions = this._getTypeOptions(typeId);
      this.val(typeOptions.defaultValue);
    },

    _onCreativeCommonsAttributeChange: function (event, data) {
      var option = $(event.target);
      
      var creativeCommons = this._parseCreativeCommons(this.val());
      var attribute = option.attr('data-attribute');
      var removeAttributes = option.attr('data-remove-attributes');
      
      if (attribute && creativeCommons.attributes.indexOf(attribute) == -1) {
        creativeCommons.attributes.push(attribute);
      }
      
      if (removeAttributes) {
        $.each(removeAttributes.split(','), function (index, removeAttribute) {
          var removeIndex = creativeCommons.attributes.indexOf(removeAttribute);
          if (removeIndex != -1) {
            creativeCommons.attributes.splice(removeIndex, 1);
          }
        });
      }
      
      this.val(this._createCreativeCommonsUrl(creativeCommons));
    },
    
    _getText: function (key) {
      if (this.options.locale) {
        var text = this.options.locales[this.options.locale][key];
        if (text) {
          return text;  
        }
      }
      
      return this.options.locales['en'][key];
    },
    
    _getTypeOptions: function (id) {
      return this.options.types[id];
    },
    
    _supportsType: function (id) {
      return this._getTypeOptions(id);
    },
    
    _addType: function (id, type) {
      this._widget.find('select.type')
        .append($('<option>')
            .val(id)
            .attr({
              'name': 'type'
            })
            .text(this._getText(type.labelLocale))
        );
      
      switch (type.strategy) {
        case 'cc':
          $('<div>') 
            .attr({
              'data-type-id': id
            })
            .addClass('type-options creative-commons-container')
            .append($('<label>').text(this._getText('createCommonsDerivatives')))
            .append(this._createCreativeCommonsList('creative-commons-derivatives', {
              'yes': { label: this._getText('createCommonsDerivativesYes'), 'remove-attributes': 'sa,nd', 'default': true }, 
              'no': { label:  this._getText('createCommonsDerivativesNo'), 'attribute': 'nd', 'remove-attributes': 'sa' }, 
              'share_alike': { label: this._getText('createCommonsDerivativesShareAlike'), 'attribute': 'sa', 'remove-attributes': 'nd' }
            }))
            .append($('<label>').text(this._getText('createCommonsCommercial')))
            .append(this._createCreativeCommonsList('creative-commons-commercial', {
              'yes': { label: this._getText('createCommonsCommercialYes'), 'remove-attributes': 'nc', 'default': true }, 
              'no': { label: this._getText('createCommonsCommercialNo'), 'attribute': 'nc' } 
            }))
            .hide()
            .appendTo(this._widget);
        break;
        case 'ogl':
        case 'cc0':
        case 'url':
        case 'none':
        break;
      }
    },
    
    _createCreativeCommonsList: function (name, options) {
      var container = $('<div>');
      
      $.each(options, $.proxy(function (key, value) {
        var optionId = this._name + '-' + name + '-' + key; 
        
        $('<span>')
          .append($('<input>')
            .attr({
              'type': 'radio',
              'name': this._name + '-' + name,
              'value': key,
              'id': optionId,
              'data-attribute': value['attribute'],
              'data-remove-attributes': value['remove-attributes'],
              'data-default': value['default']
            }))
            .addClass('creative-commons-attribute')
            .append($('<label>').attr({
              'for': optionId  
            }).text(value.label))
          .appendTo(container);
      }, this));
      
      return container;
    },
    
    _getPlaceholder: function (type) {
      if (type) {
        var typeOptions = this._getTypeOptions(type);
        if (typeOptions) {
          if (typeOptions.placeholderLocale) {
            return this._getText(typeOptions.placeholderLocale);
          }
        }
      }
      
      return null;
    },
    
    _resolveStrategy: function (type) {
      if (type) {
        var typeOptions = this._getTypeOptions(type);
        if (typeOptions) {
          return typeOptions.strategy;
        }
      }
      
      return 'url';
    },
    
    _resolveType: function (url, selectedType) {
      if (url) {
        if (this._supportsType('cc0-1.0') && (url == CC0_URL)) {
          return 'cc0-1.0';
        } else if (this._supportsType('ogl') && (url == OGL_URL)) {
          return 'ogl';
        } else {
          if (this._supportsType('cc-4.0')||this._supportsType('cc-3.0')) {
            var creativeCommons = this._parseCreativeCommons(url);
            if (creativeCommons) {
              if (creativeCommons.version == '3.0') {
                if (this._supportsType('cc-3.0')) {
                  return 'cc-3.0'; 
                }
              } else {
                if (this._supportsType('cc-4.0')) {
                  return 'cc-4.0'; 
                }
              }
            }
          }
        }
      } else {
        if (selectedType == 'link') {
          // empty url can be interpret as link or none so we need to prefer the selected type
          return selectedType;
        }
      }
      
      return 'none';
    },
    
    _parseCreativeCommons: function (url) {
      var protolless = url.replace(/^[a-z]*:\/\//, '');
      if (protolless.indexOf(CC_URL_PREFIX) === 0) {
        var parts = protolless.substring(CC_URL_PREFIX.length).split('/');
        if (parts.length == 1) {
          if (StringUtils.equals(parts[0], "publicdomain")) {
            // Public domain
            return {
              'attributes': ['publicdomain']
            };
          } else {
            // Without jurisdiction and version
            return {
              'attributes': parts[0].split("-")
            };
          }
        } else if (parts.length == 2) {
          // Without jurisdiction
          return {
            attributes: parts[0].split("-"),
            version: parts[1]
          };
        } else if (parts.length == 3) {
          // With jurisdiction
          return {
            attributes: parts[0].split("-"),
            version: parts[1],
            jurisdiction: parts[2]
          };
        }
      }
      
      return null;
    },
    
    _createCreativeCommonsUrl: function (objectModel) {
      return "https://"
        + CC_URL_PREFIX 
        + objectModel.attributes.join('-')
        + '/'
        + (objectModel.version ? objectModel.version : '')
        + (objectModel.jurisdiction ? objectModel.jurisdiction : '');
    },
    
    _destroy: function () {
      
    }
  });
  
}).call(this);