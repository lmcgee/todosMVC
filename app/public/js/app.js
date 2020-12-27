/*global jQuery, Handlebars, Router */
jQuery(function($) {
  "use strict";

  Handlebars.registerHelper("eq", function(a, b, options) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  var ENTER_KEY = 13;
  var ESCAPE_KEY = 27;

  var todos;
  // var filter = {filter: '/all'};
  var filter;

  var todoTemplate = Handlebars.compile($("#todo-template").html());
  var footerTemplate = Handlebars.compile($("#footer-template").html());

  function uuid() {
    /*jshint bitwise:false */
    var i, random;
    var uuid = "";

    for (i = 0; i < 32; i++) {
      random = (Math.random() * 16) | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        uuid += "-";
      }
      uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(
        16
      );
    }

    return uuid;
  }

  // pluralize: function (count, word) {
  function pluralize(count, word) {
    return count === 1 ? word : word + "s";
  }

  // store: function (namespace, data) {
  function store(namespace, data) {
    if (arguments.length > 1) {
      return localStorage.setItem(namespace, JSON.stringify(data));
    } else {
      var store = localStorage.getItem(namespace);
      return (store && JSON.parse(store)) || [];
    }
  }

  function toggle(e) {
    var i = indexFromEl.call(this, e.target);
    todos[i].completed = !todos[i].completed;
    render();
  }

  function create(e) {
    var $input = $(e.target);
    var val = $input.val().trim();

    if (e.which !== ENTER_KEY || !val) {
      return;
    }

    todos.push({
      id: uuid(),
      title: val,
      completed: false
    });

    $input.val("");

    render();
  }

  function toggleAll(e) {
    var isChecked = $(e.target).prop("checked");

    todos.forEach(function(todo) {
      todo.completed = isChecked;
    });

    render();
  }

  function destroyCompleted() {
    todos = getActiveTodos();
    this.filter = "all";
    render();
  }

  function edit(e) {
    var $input = $(e.target)
      .closest("li")
      .addClass("editing")
      .find(".edit");
    $input.val($input.val()).focus();
  }

  function editKeyup(e) {
    if (e.which === ENTER_KEY) {
      e.target.blur();
    }

    if (e.which === ESCAPE_KEY) {
      $(e.target)
        .data("abort", true)
        .blur();
    }
  }

  function update(e) {
    var el = e.target;
    var $el = $(el);
    var val = $el.val().trim();

    if (!val) {
      destroy(e);
      return;
    }

    if ($el.data("abort")) {
      $el.data("abort", false);
    } else {
      todos[indexFromEl.call(this, el)].title = val;
    }

    render();
  }

  function destroy(e) {
    todos.splice(indexFromEl.call(this, e.target), 1);
    render();
  }

  function bindEvents() {
    $("#new-todo").on("keyup", create.bind(this));
    $("#toggle-all").on("change", toggleAll.bind(this));
    $("#footer").on("click", "#clear-completed", destroyCompleted.bind(this));
    $("#todo-list")
      .on("change", ".toggle", toggle.bind(this))
      .on("dblclick", "label", edit.bind(this))
      .on("keyup", ".edit", editKeyup.bind(this))
      .on("focusout", ".edit", update.bind(this))
      .on("click", ".destroy", destroy.bind(this));
  }

  function render() {
    var todos = getFilteredTodos.apply(this);
    $("#todo-list").html(todoTemplate(todos));
    $("#main").toggle(todos.length > 0);
    $("#toggle-all").prop("checked", getActiveTodos().length === 0);
    renderFooter.apply(this);
    $("#new-todo").focus();
    store("todos-jquery", todos);
  }

  function renderFooter() {
    var todoCount = todos.length;
    var activeTodoCount = getActiveTodos().length;
    var template = footerTemplate({
      activeTodoCount: activeTodoCount,
      activeTodoWord: pluralize(activeTodoCount, "item"),
      completedTodos: todoCount - activeTodoCount,
      filter: document.filter
    });

    $("#footer")
      .toggle(todoCount > 0)
      .html(template);
  }

  function indexFromEl(el) {
    var id = $(el)
      .closest("li")
      .data("id");
    var newTodos = todos;
    var i = newTodos.length;

    while (i--) {
      if (newTodos[i].id === id) {
        return i;
      }
    }
  }

  function init() {
    todos = store("todos-jquery");

    new Router({
      "/:filter": function(filter) {
        this.filter = filter;
        render.apply(this);
      }.bind(this)
    }).init("/all");

    bindEvents.apply(this);
  }

  function getFilteredTodos() {
    if (document.filter === "active") {
      return getActiveTodos();
    }

    if (document.filter === "completed") {
      return getCompletedTodos();
    }
    return todos;
  }

  function getActiveTodos() {
    return todos.filter(function(todo) {
      return !todo.completed;
    });
  }

  function getCompletedTodos() {
    return todos.filter(function(todo) {
      return todo.completed;
    });
  }

  init.apply(this);
});
