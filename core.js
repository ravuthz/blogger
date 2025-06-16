function copyPostUrl() {
  // Close modal or element
  document.getElementById('closeWilltoCopyPostUrl').click();

  // Select and copy the URL from the input field
  const urlInput = document.getElementById('sharePostUrl');
  urlInput.select();
  urlInput.setSelectionRange(0, 99999); // For mobile compatibility

  // Copy the text to clipboard
  navigator.clipboard.writeText(urlInput.value).then(() => {
    // Show Bootstrap Toast
    const toast = new bootstrap.Toast(document.getElementById('liveToast1'));
    toast.show();
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
}

function initComments(items, messages, config) {
  let cursor = null;

  if (items.length > 0) {
    cursor = parseInt(items[items.length - 1].timestamp) + 1;
  }

  function bodyFromEntry(entry) {
    const text =
      (entry?.content?.$t || entry?.summary?.$t || '');

    const removed = entry?.gd$extendedProperty?.some(
      (prop) => prop.name === 'blogger.contentRemoved'
    );

    return removed
      ? `<span class="deleted-comment">${text}</span>`
      : text;
  }

  function parse(data) {
    cursor = null;
    const comments = [];

    if (data?.feed?.entry) {
      for (const entry of data.feed.entry) {
        const comment = {};
        const idMatch = /blog-(\d+).post-(\d+)/.exec(entry.id?.$t);
        comment.id = idMatch ? idMatch[2] : null;
        comment.body = bodyFromEntry(entry);
        comment.timestamp = Date.parse(entry.published.$t).toString();

        const author = entry.author?.[0];
        if (author) {
          comment.author = {
            name: author.name?.$t,
            profileUrl: author.uri?.$t,
            avatarUrl: author['gd$image']?.src
          };
        }

        if (entry.link?.[2]) {
          comment.link = comment.permalink = entry.link[2].href;
        }
        if (entry.link?.[3]) {
          const pidMatch = /.*comments\/default\/(\d+)\?.*/.exec(entry.link[3].href);
          if (pidMatch?.[1]) {
            comment.parentId = pidMatch[1];
          }
        }

        comment.deleteclass = 'item-control blog-admin';

        if (entry.gd$extendedProperty) {
          for (const prop of entry.gd$extendedProperty) {
            if (prop.name === 'blogger.itemClass') {
              comment.deleteclass += ` ${prop.value}`;
            } else if (prop.name === 'blogger.displayTime') {
              comment.displayTime = prop.value;
            }
          }
        }

        comments.push(comment);
      }
    }

    return comments;
  }

  function hasMore() {
    return !!cursor;
  }

  function paginator(callback) {
    if (!hasMore()) return;

    let url = `${config.feed}?alt=json&v=2&orderby=published&reverse=false&max-results=50`;
    if (cursor) {
      url += `&published-min=${new Date(cursor).toISOString()}`;
    }

    window.bloggercomments = function (data) {
      const parsed = parse(data);
      cursor = parsed.length < 50 ? null : parseInt(parsed[parsed.length - 1].timestamp) + 1;
      callback(parsed);
      window.bloggercomments = null;
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `${url}&callback=bloggercomments`;
    document.head.appendChild(script);
  }

  function getMeta(key, comment) {
    switch (key) {
      case 'iswriter':
        return comment.author?.name === config.authorName &&
          comment.author?.profileUrl === config.authorUrl
          ? 'true'
          : '';
      case 'deletelink':
        return `${config.baseUri}/delete-comment.g?blogID=${config.blogId}&postID=${comment.id}`;
      case 'deleteclass':
        return comment.deleteclass;
      default:
        return '';
    }
  }

  let replybox = null;
  let replyUrlParts = null;
  let replyParent;

  function onReply(commentId, domId) {
    if (!replybox) {
      replybox = document.getElementById('comment-editor');
      if (replybox) {
        replybox.height = '250px';
        replybox.style.display = 'block';
        replyUrlParts = replybox.src.split('#');
      }
    }

    if (replybox && commentId !== replyParent) {
      replybox.src = '';
      document.getElementById(domId).appendChild(replybox);
      replybox.src = `${replyUrlParts[0]}${commentId ? `&parentID=${commentId}` : ''}#${replyUrlParts[1]}`;
      replyParent = commentId;
    }
  }

  const hash = window.location.hash.slice(1);
  let initReplyThread = null;
  let initComment = null;

  if (hash.startsWith('comment-form_')) {
    initReplyThread = hash.replace('comment-form_', '');
  } else if (/^c\d+$/.test(hash)) {
    initComment = hash.slice(1);
  }

  const provider = {
    id: config.postId,
    data: items,
    loadNext: paginator,
    hasMore,
    getMeta,
    onReply,
    rendered: true,
    initComment,
    initReplyThread,
    config: { maxDepth: config.maxThreadDepth },
    messages
  };

  function render() {
    const holder = document.getElementById('comment-holder');
    if (window.goog?.comments) {
      window.goog.comments.render(holder, provider);
    }
  }

  if (window.goog?.comments) {
    render();
  } else {
    window.goog = window.goog || {};
    window.goog.comments = window.goog.comments || {};
    window.goog.comments.loadQueue = window.goog.comments.loadQueue || [];
    window.goog.comments.loadQueue.push(render);
  }
}
