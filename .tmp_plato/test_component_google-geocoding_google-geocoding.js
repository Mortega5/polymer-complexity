
Polymer({
  is: 'google-geocoding',
  /**
  * Fired when a geocoding request send a response.
  *
  * @event google-geocoding-request
  * @event google-geocoding-request
  */
  /**
  * Fired when a geocoding request send an error.
  *
  * @event google-geocoding-error
  * @event google-geocoding-error
  */

  /**
  * Fired when a geocoding response is ready.
  *
  * @event google-geocoding-response
  * @event google-geocoding-response
  */
  properties: {
    /**
    * Params for request latitude and longitude of selected city
    */
    geo_params: {
      type: 'Object',
      computed: '_getGeoParams(api_key,city, components, bounds,language,region)'
    },
    /**
    * Google geoencody api_key.
    * Go to https://developers.google.com/maps/documentation/geocoding/get-api-key
    * to get your key
    */
    api_key: {
      type: 'String',
      vale:'',
      reflectToAttribute: true,
      bind: 'input'
    },
    /**
    * `City` where you want to obtain traffic information
    */
    city: {
      type: 'String',
      value:'',
      reflectToAttribute: true,
      notify:true,
      bind: 'input'
    },
  /**
    * The component filters, separated by a pipe (|).
    * Each component filter consists of a component:value pair and
    * will fully restrict the results from the geocoder
  */
    components: {
      type: 'String',
      value: '',
      notify:true,
      bind: 'input'
    },
  /**
    * The bounding box of the viewport within which to bias geocode results more prominently.
    * This parameter will only influence, not fully restrict, results from the geocoder
    */
    bounds:{
      type: 'String',
      value: '',
      notify:true,
      bind: 'input'
    },
    /**
      * The language in which to return results.
      * If language is not supplied, the geocoder attempts to use the preferred
      * language as specified in the Accept-Language header, or the native language of the domain
      * from which the request is sent.
      * If a name is not available in the preferred language, the geocoder uses the closest match.
      */
    language:{
      type: 'String',
      value: '',
      notify:true,
      bind: 'input'
    },
  /**
    * The region code, specified as a ccTLD ("top-level domain") two-character value.
    * This parameter will only influence, not fully restrict, results from the geocoder.
    */
    region:{
      type: 'String',
      value: '',
      notify:true,
      bind: 'input'
    },
  /**
    * If true, automatically performs an Ajax request when either url or params changes
    */
    auto: {
      type: 'Boolean',
      value: false,
      notify:true,
      bind: 'input'
    },
    data: {
      type: 'Array',
      value: function(){return []},
      notify:true,
      bind: 'output'
    },
    locations: {
      type: 'Coordinates',
      value: function(){return {latitude:null,longitude:null}},
      bind: 'output',
      notify: true
    }
  },
  ready: function(){
    this.ready = true
  },
  // computed properties
  _getGeoParams: function(api_key,city, components, bounds,language,region){
    var params = {};
    if (api_key){
      params.key = api_key;
      if (city)params.address = city;
      if (components)params.components = components;
      if (bounds)params.bounds = bounds;
      if (language)params.language = language;
      if (region)params.region = region;
      if (this.ready && this.auto){
        this.$.requestGeocode.generateRequest();
      }
    } else {
      console.error('Api key is required');
    }
    return params;
  },

  // Observers
  updatedUrl: function(){
    if (this.ready && this.auto){
      this.$.requestGeocode.generateRequest();
    }
  },

  // Functions
  /**
    * Generate a new Request to Google Maps Geocoding
    */
  generateRequest:function(){
    this.$.requestGeocode.generateRequest();
  },
  _geocodingResponse: function(e,res){
    this.fire('google-geocoding-response',{response:res,data:res.response.results});
    this.set('locations',{longitude:res.response.results[0].geometry.location.lng,latitude:res.response.results[0].geometry.location.lat})
    this.set('data',res.response.results);
  },
  _gecodingError: function(e){
    this.fire('google-geocoding-error',{response:e});
  },
  _geocodingResquest: function(e){
    this.fire('google-geocoding-request');
  }

});
