import React, { Component } from 'react'
import { render } from 'react-dom'
import css from './show.scss'
import Header from '../../Layout/Header/Header'
import Footer from '../../Layout/Footer/Footer'
import Modal from '../../Utility/Modal/Modal'
import Comments from '../../Comments/Comments'
import Loader from '../../Common/Loader/Loader'
import Sentiment from '../../Common/Sentiment/Sentiment'
import i18n from './locale'
import Chart from 'chart.js'
import { ShareButtons, generateShareIcon } from 'react-share';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

const { FacebookShareButton, TwitterShareButton } = ShareButtons;
const FacebookIcon = generateShareIcon('facebook');
const TwitterIcon = generateShareIcon('twitter');

export default class DevSiteShow extends Component {
  constructor(props) {
    super(props);
    this.state = { showFiles: false, loading: true }
    this.devSiteId = document.querySelector('#dev-site-show').dataset.id;
    this.loadDevSite = () => this._loadDevSite();
    this.handleEmail = (e) => this._handleEmail(e);
    this.openEmailModal = (e) => this._openEmailModal(e);
  }

  componentDidMount() {
    this.loadDevSite();
  }

  _loadDevSite() {
    $.ajax({
      url: `/dev_sites/${this.devSiteId}`,
      dataType: 'JSON',
      type: 'GET',
      success: devSite => this.setState({ devSite, loading: false }),
      error: () => {
        window.flash('alert', 'Failed to load Development Site. Reload the page and try again.')
      }
    })
  }

  _handleEmail(e) {
    e.preventDefault();
    const { contact } = this.state;
    const url = contact === 'Urban Planner' ? '/contact_file_lead' : '/contact_councillor';
    const { locale } = document.body.dataset;
    i18n.setLanguage(locale);
    const { messageSent, mustSign } = i18n
    $.ajax({
      url,
      dataType: 'JSON',
      type: 'POST',
      cache: false,
      contentType: false,
      processData: false,
      data: new FormData(e.currentTarget),
      success: () => {
        window.flash('notice', messageSent)
        this.setState({ showModal: false });
      }
    })
  }

  _openEmailModal(e) {
    e.preventDefault();
    const { urban_planner_email, ward_councillor_email } = this.state.devSite;
    const contact = e.currentTarget.innerText;
    this.setState({ showModal: true, contact });
  }

  render() {
    const { devSite, loading, showModal, contact } = this.state;
    const { locale } = document.body.dataset;
    const latestStatus = devSite ? devSite.statuses.slice(-1).pop().status : ''
    i18n.setLanguage(locale);
    return(
      <div className={css.root}>
        <Header />
        <div className={`${css.container} container`}>
          <Loader loading={loading} />
          {
            !loading &&
            <div>
              <div>
                <h3 className={css.status}>{latestStatus}</h3>
                  <div className='row'>
                    <div className='col m12 s4'>
                      <img src={devSite.image_url} className={css.image} />
                      <h3>{devSite.address}</h3>
                      {i18n.devId}: {devSite.devID} <br/>
                      {devSite.application_type_name.replace(/coa/, 'Committee of Adjustment')} <br/>

                      <div>
                          <Tabs>
                            <TabList>
                              <Tab>{i18n.description}</Tab>
                              <Tab>{i18n.attachments}</Tab>
                              <Tab>{i18n.notices}</Tab>
                            </TabList>

                            <TabPanel>
                              <h3 className={css.description}>Project Description</h3>
                              <div dangerouslySetInnerHTML={{__html: devSite.description }}></div>
                            </TabPanel>
                            <TabPanel>
                              {
                                (devSite.city_files.length > 0 || devSite.files.length > 0) &&
                                <h3 className={css.description}>{i18n.file}</h3>
                              }
                              {
                                devSite.city_files.map((file, i) => {
                                  return(
                                    <div key={i}>
                                      <a href={file.link} target='_blank' className={css.filelink}>{file.name}</a>
                                    </div>
                                  )
                                })
                              }
                              {
                                devSite.files.map((file, i) => {
                                  return(
                                    <div key={i}>
                                      <a href={file.url} target='_blank' className={css.filelink}>{file.name}</a>
                                    </div>
                                  )
                                })
                              }
                            </TabPanel>
                            <TabPanel>
                              <h3 className={css.description}>{i18n.notices}</h3>
                              {
                                devSite.statuses &&
                                devSite.statuses.map((status, i) => {
                                  if (status.notification && status.notification.filesuploader) {
                                    return(
                                      <div key={i}>
                                        <a href={status.notification.filesuploader.url} target='_blank' className={css.filelink}>{status.notification.filesuploader.name}</a>
                                      </div>
                                    )
                                  }
                                })
                              }
                            </TabPanel>
                          </Tabs>
                     </div>
                  <h3 className={css.timeline}>Project Timeline</h3>
                  </div>
                  <div className='row'>
                    <div className='col s6'>
                      {i18n.appType}:
                    </div>
                    <div className='col s6'>
                      {devSite.application_type_name.replace(/coa/, 'Committee of Adjustment')}
                    </div>
                  </div>
                  <div className='row'>
                    <div className='col s6'>
                      {i18n.wardName}:
                    </div>
                    <div className='col s6'>
                      {devSite.ward_name}
                    </div>
                  </div>

                  <h3 style={{padding: '0 0.75rem'}}><b>{i18n.status}</b></h3>
                  {
                    devSite.statuses.map(status => {
                      return(
                        <div className='row' key={status.id}>
                          <div className='col s12 m6'>{status.status}</div>
                          <div className='col s12 m6'>{status.friendly_status_date}</div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
              <div className='row'>
                <div className='col s12 m6'>

                  {
                    devSite.sentiment &&
                    <h3><b>Sentiment</b></h3>
                  }
                  {
                    devSite.sentiment &&
                    <Sentiment
                      anger={devSite.sentiment.anger}
                      disgust={devSite.sentiment.disgust}
                      fear={devSite.sentiment.fear}
                      joy={devSite.sentiment.joy}
                      sadness={devSite.sentiment.sadness}
                      />
                  }
                </div>
                <div className='col s12 m6'>
                  <h3><b>{i18n.comments}</b></h3>

                  <Comments devSiteId={devSite.id} />
                </div>
              </div>
            </div>
          }
        </div>
        {
          showModal &&
          <Modal parent={this}>
            <EmailModal contact={contact} address={devSite.address} id={devSite.id} handleEmail={this.handleEmail} />
          </Modal>
        }
        <Footer/>
      </div>
    );
  }
}

const EmailModal = (props) => {
  return(
    <div className={css.emailmodal} tabIndex='-1'>
      <div className={css.contact} >Contact {props.contact}</div>
      <div className={css.address}>{props.address}</div>

      <form onSubmit={props.handleEmail} acceptCharset='UTF-8' >
        <input name='utf8' type='hidden' value='✓' />
        <input value={props.id} type='hidden' name='dev_site_id' />
        <div className='input-field'>
          <label>{i18n.name}</label>
          <input type='text' required='required' name='name' className={css.input} />
        </div>
        <div className='input-field'>
          <label>{i18n.email}</label>
          <input type='text' required='required' name='email' className={css.input} />
        </div>
        <div className='input-field'>
          <label>{i18n.message}</label>
          <textarea name='message' required='required' className={css.textarea}></textarea>
        </div>
        <input type='submit' name='commit' value='Send' className='btn' />
      </form>
    </div>
  )
}

document.addEventListener('turbolinks:load', () => {
  const devSiteShow = document.querySelector('#dev-site-show');
  devSiteShow && render(<DevSiteShow/>, devSiteShow)
})
