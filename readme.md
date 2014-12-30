# Super Select - an Angular module #

A simple directive module for creating powerful select lists.

### HOW TO USE IT ###
Include this in your loaded scripts, add it as a dependency in your Angular App declaration. 
You may also want to include the default CSS file, it handles most of the layout and should generally work fine. If you don't include this, it definitely won't look like a select list at all by itself.

### THINGS THAT HELP: ###
 * It makes use of [Font Awesome](http://fortawesome.github.io/Font-Awesome/) for some simple icons. You don't really need these, but they're nice.
 * Angular is kind of a must. I mean, maybe you can use it elsewhere? Probably not though.

### WHAT IT CAN DO ###
 * Fully stylable select list! This was the main reason for making this module. Styling the face of a native select list without being able to style the list itself was a thing I had to explain too many times.
 * Filterable list! Since we're already playing within Angular, this is a pretty common and trivial task, but is a nice feature for some longer lists that come up (_'Select your country from this list of ALL COUNTRIES IN THE WORLD'_)
 * Select full objects, or just a single key! One or the other here, anything more custom than that, you can handle on your end.
 * Mark as a required field! This has some pretty simple validation right now, nothing incredibly robust: it just makes sure that _something_ has been selected, and will show a flag (if you have Font Awesome loaded) next to the list if your user forgot to choose one :( 
 * Optional more-robust validation! You can pass in your own function for validation, if its really that complex for you. This might be a thing if certain values aren't allowed in combination on your form.
 * Act like a select list! More on this coming up.

Most of the above are clear and simple, acting like a select list is a tricky thing though. Selects are nice, native things that can close themselves when you click anywhere else in on the page. Replicating that behavior requires a bit of a trick, and the current implementation here is by no means the One True Answer. If you can live without this behavior, ignore the optional `scopeBind` parameter. If you'd like to make use of it, set the value of this parameter to the _scope ID of the desired parent_. This could be the controller whose view contains the select list, or you might want it to be the rootScope (not generally recommended). The directive will do two things if you include this parameter:
 1. Create a listener and broadcaster on the scope you specified. These will listen for a native click event to bubble up, as well as listening for an emitted Angular event from one of our select lists, and upon receiving either of these, will broadcast down to all child scopes that a click has been heard.
 2. Create a listener on the super select's scope, which will listen for a broadcasted event and close the list if the source of that event was not a click on the current list.

Because of the nature of broadcasting an event downward to all children, using the rootScope is discouraged because the event will be sent to every scope in your application, which could potentially be a rather large number if you have a large application. Most applications probably wouldn't notice this as a problem, but it is still a poor idea that shouldn't be encouraged.

This module as responsible and cleans up all listeners on `$destroy`, assuming it receives this event (which it should, in most cases). One known case that does not allow for this is with the [Modals from Angular UI Bootstrap](http://angular-ui.github.io/bootstrap/#/modal), but I leave open the possibility that something else was at fault in that case.

### TODO ###
 * Add support for flag to add 'onLeft' class to validation icon. The CSS for this already exists.
 * Change SuperSelectKey to allow for static and optional
 * Accurate default validation for objects instead of strings
 * Add field restriction option for filtering
 * Add external filtering variable (e.g another select field value)
