import React, { Component } from 'react'
import { render } from 'react-dom'
import { List } from 'immutable'
import css from './comments.scss'

export default class Comments extends Component {
  constructor(props) {
    super(props);
    this.state = { comments: List(), page: 0, limit: 5 }
    this.loadComments = () => this._loadComments();
    this.hasMoreComments = () => this._hasMoreComments();
    this.appendMoreComments = () => this._appendMoreComments();
    this.loadComments();
  }
  componentDidUpdate(prevProps, prevState) {
    if(prevProps.devSiteId !== this.props.devSiteId) {
      this.setState({ page: 0, comments: List()},
        () => this.loadComments()
      )
    }
  }
  _loadComments() {
    $.getJSON(`/dev_sites/${this.props.devSiteId}/comments`,
      { page: this.state.page, limit: this.state.limit },
      json => this.setState({ comments: List(json.comments), total: json.total })
    );
  }
  _hasMoreComments() {
    const { page, total, limit } = this.state;
    return ( (page + 1) * limit < total );
  }
  _appendMoreComments() {
    this.setState({ page: this.state.page + 1 },
      () => {
        $.getJSON(`/dev_sites/${this.props.devSiteId}/comments`,
          { page: this.state.page, limit: this.state.limit },
          json => this.setState({ comments: this.state.comments.push(...json.comments), total: json.total })
        );
      }
    );
  }
  render() {
    const { comments, total } = this.state;
    return <div className={css.container}>
      <CommentForm {...this.props} parent={this} />
      {total > 0 && <div className={css.number}> {total} responses</div>}
      {comments.map(comment => <Comment comment={comment} key={comment.id} />)}
      {this.hasMoreComments() && <a onClick={this.appendMoreComments} className={css.loadmore}>Load More Comments</a> }
    </div>;
  }
}

class CommentForm extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.parent = this.props.parent;
    this.handleChange = (e) => this.setState({ body: e.target.value });
    this.submitForm = (e) => this._submitForm(e);
  }
  _submitForm(e) {
    e.preventDefault();
    const { body, limit } = this.state;
    $.ajax({
      url: `/dev_sites/${this.props.devSiteId}/comments`,
      dataType: 'JSON',
      type: 'POST',
      cache: false,
      data: {comment: { body: body }, limit: limit },
      success: (json) => {
        this.parent.setState({
          comments: this.parent.state.comments.unshift(json),
          total: this.parent.state.total + 1
        })
        this.setState({ body: '' });
      }
    });
  }
  render() {
    return <form id='new_comment' onSubmit={this.submitForm}>
      <input name='utf8' type='hidden' value='✓' />
      <div className={css.wrapper}>
        <textarea className={css.textarea}
                  value={this.state.body}
                  onChange={this.handleChange}
                  placeholder='What do you think?'>
        </textarea>
        <input type='submit' value='Comment' className={css.submit}/>
      </div>
    </form>
  }

}

const Comment = (props) => {
  return <div className={css.comment}>
    <div className={css.info}>
      <span className={css.name}>
        {props.comment.user ? props.comment.user.username : 'Anonymous'}
      </span>
      <span className={css.date}>
        {moment(props.comment.created_at).format('MMMM DD, YYYY ')}
      </span>
    </div>
    <div className={css.body}
         dangerouslySetInnerHTML={{__html: props.comment.body.replace(/\n\r?/g, '<br>') }}>
    </div>
  </div>
}
