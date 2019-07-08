'use strict';

const api = require('./api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    let action = 'firstpage';

    // items: search
    let page = parseInt(activity.Request.Query.page) || 1;
    let pageSize = parseInt(activity.Request.Query.pageSize) || 20;

    // nextpage request
    if (activity.Request.Data && activity.Request.Data.args && activity.Request.Data.args.atAgentAction === 'nextpage') {
      page = parseInt(activity.Request.Data.args._page) || 2;
      pageSize = parseInt(activity.Request.Data.args._pageSize) || 20;
      action = 'nextpage';
    }

    if (page < 0) page = 1;
    if (pageSize < 1 || pageSize > 99) pageSize = 20;

    let url = '/?seed=adenin';
    url += '&page=' + page;
    url += '&results=' + pageSize;
    url += '&inc=name,email,location,picture';

    const response = await api(url);

    if (!response || response.statusCode !== 200) {
      activity.Response.ErrorCode = response.statusCode || 500;
      activity.Response.Data = {ErrorText: 'request failed'};
    } else {
      const items = response.body.results;

      activity.Response.Data._action = action;
      activity.Response.Data._page = page;
      activity.Response.Data._pageSize = pageSize;
      activity.Response.Data.items = [];

      for (let i = 0; i < items.length; i++) {
        const item = convertItem(items[i]);
        activity.Response.Data.items.push(item);
      }
    }
  } catch (error) {
    // Return error response
    let m = error.message;
    if (error.stack) m = m + ': ' + error.stack;

    activity.Response.ErrorCode = (error.response && error.response.statusCode) || 500;
    activity.Response.Data = {ErrorText: m};
  }

  function convertItem(_item) {
    const item = {
      title: _item.name.first + ' ' + _item.name.last,
      description: _item.email,
      picture: _item.picture.large
    };

    let id = _item.picture.large;
    id = id.substring(id.lastIndexOf('/') + 1); // extract id from image name
    item.id = id.substring(0, id.indexOf('.'));

    // read the avatars card setting
    item.showAvatar = activity.Context.ContentItemSettings.showAvatars;

    return item;
  }
};
