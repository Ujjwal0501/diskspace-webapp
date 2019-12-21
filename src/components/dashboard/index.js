import React from 'react';
import { connect } from 'react-redux';

import {
  Icon,
  Sidebar,
  Menu,
  Segment,
  Image,
  Header,
  Grid,
  Modal,
  Button
} from 'semantic-ui-react';
import Dropzone from 'react-dropzone';
import fixRotation from 'fix-image-rotation';
import firebase from '../../firebase';
import axios from 'axios';

import NavBar from '../common/header';
import {
  loadImages,
  uploadImage
} from './actions';

import styles from './dashboard.module.css';

const mapStateToProps = state => {
	return {
    isAuthenticated: state.home.isAuthenticated,
    profile: state.home.details.profile,
	};
};

const mapDispatchToProps = dispatch => {
	return {
    uploadImage: (email, image) => dispatch(uploadImage(email, image))
	};
};

@connect(mapStateToProps, mapDispatchToProps)
class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.aref = React.createRef();
  }

	state = {
    open: false,
    acceptedFiles: [],
    images: [],
    zoom:false,
    image: ''
  };

  componentDidMount() {
    const { email } = this.props.profile;
    const { images } = this.state;
    var ref = firebase.database().ref("All_Image_Uploads_Database");
    ref.orderByChild("imageName").equalTo(email).on("child_added", (snapshot) => {
      console.log(snapshot.val());
      images.push({...snapshot.val(), key: snapshot.key});
      this.setState({ images });
    });
  }

  show = () => {
    this.setState({ open: true });
  }

  close = () => {
    this.setState({ open: false });
  }

  dropFile = acceptedFiles => {
    console.log(acceptedFiles)
    fixRotation.fixRotation(acceptedFiles)
			.then((arr) => {
				this.setState({
					acceptedFiles: arr,
				})
			})
			.catch(e => 
				this.setState({
					acceptedFiles
				})
			)
  }

  resetFile = acceptedFiles => {
    this.setState({acceptedFiles: []});
  }

  submitImage = () => {
    const { profile, uploadImage } = this.props;
    const file = this.state.acceptedFiles[0];
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      console.log(reader.result)
      let img = reader.result.split(',')[1];
      uploadImage(profile.email, img, this.updateImages.bind(this));
    };
    reader.onerror = (error) => {
      console.log('Error: ', error);
    };
  }

  updateImages = (image) => {
    const { images } = this.state;
    images.push(image);
    this.setState({ images });
  }

  zoomIn = (image) => {
    this.setState({ zoom: true, image });
  }

  zoomOut = () => {
    this.setState({ zoom: false, image: {} });
  }

  downloadImage = () => {
    axios
      .post('http://169c8f5e.ngrok.io/js', { "key1": this.state.image.imageURL })
      .then(res => {
        console.log(res.data)
        this.setState({extracted: res.data});
        this.aref.current.click();
        this.zoomOut();
      })
  }

  deleteImage = () => {
    const { image, images } = this.state;
    firebase.database().ref("All_Image_Uploads_Database/" + image.key).remove()
      .then(() => {
        let i = images.find(i => i.key === image.key);
        images.splice(i, 1);
        this.setState({images});
        this.zoomOut();
      })
      .catch(e => {
        console.log(e);
      })
  }

  render() {
    const { profile } = this.props;
    const { open, acceptedFiles, images, zoom, image } = this.state;

    return (
      <div>
        <NavBar />
        <div style={{position: 'relative',top: '9.5vh', marginLeft: -3, height: '90.5vh'}}>
          <Sidebar.Pushable as={Segment} style={{display: 'flex'}}>
            <Sidebar
              as={Menu}
              animation='overlay'
              icon='labeled'
              inverted
              // onHide={() => setVisible(false)}
              vertical
              visible={true}
              width='thin'
              style={{position: 'relative', display: 'inline-table', width: '13%', zIndex: 0}}
            >
              <Menu.Item as='a' active>
                <Icon name='home' />
                Home
              </Menu.Item>
              <Menu.Item as='a' onClick={this.show}>
                <Icon name='upload' />
                Upload
              </Menu.Item>
            </Sidebar>

            <Sidebar.Pusher dimmed={false} style={{width: '87%'}}>
              <Segment basic>
                {/* <Header as='h3'>Application Content</Header> */}
                <Grid relaxed columns={4}>
                  {!!images.length && 
                    images.map(i =>
                      <Grid.Column>
                        <Image src={`data:image/png;base64,${i.imageURL}`} onClick={() => this.zoomIn(i)}/>
                      </Grid.Column>
                    )
                  }
                </Grid>
              </Segment>
              <a ref={this.aref} href={this.state.extracted} style={{display: 'none'}} download > </a>
              <Modal size={'fullscreen'} closeIcon={<Icon name="close" style={{color: '#fff', top: '-10px'}}/>} open={zoom} onClose={this.zoomOut} style={{background: 'transparent', boxShadow: 'none'}}>
                <Modal.Content style={{background: 'transparent'}}>
                  <div className={styles.preview}>
                    <Image src={`data:image/png;base64,${image.imageURL}`} style={{maxWidth: '100%', maxHeight: '70vh'}}/>
                  </div>
                </Modal.Content>
                <Modal.Actions style={{background: 'transparent'}}>
                  <Button
                    negative
                    icon='delete'
                    labelPosition='right'
                    content='Delete'
                    onClick={this.deleteImage}
                  />
                  <Button
                    positive
                    icon='download'
                    labelPosition='right'
                    content='Download'
                    onClick={this.downloadImage}
                  />
                </Modal.Actions>
              </Modal>
            </Sidebar.Pusher>
          </Sidebar.Pushable>
          <Modal size={'small'} open={open} onClose={this.close}>
            <Modal.Header>Upload Image</Modal.Header>
            <Modal.Content>
              {/* <p>Are you sure you want to delete your account</p> */}
              
              {!acceptedFiles.length ?
                <Dropzone  accept={['image/jpeg', 'image/jpg']} onDrop={this.dropFile}>
                {({getRootProps, getInputProps}) => (
                  <section>
                    <div {...getRootProps()} className={styles.dropzone}>
                      <input {...getInputProps()}/>
                      <p>Drag 'n' drop image here, or click to select image</p>
                    </div>
                  </section>
                )}
              </Dropzone>:
              acceptedFiles.map(file => (
                <div key={file.path} className={styles.preview}>
                  <Image size={"medium"} src={URL.createObjectURL(file)}/>
                  <Icon name="close" size={"big"} className={styles.close} onClick={this.resetFile}/>
                </div>
              ))}
            </Modal.Content>
            <Modal.Actions>
              <Button negative onClick={() => {this.resetFile(); this.close()}}>Cancel</Button>
              <Button
                positive
                icon='plus'
                labelPosition='right'
                content='Upload'
                onClick={this.submitImage}
              />
            </Modal.Actions>
          </Modal>
        </div>
      </div>
    );
  }
}

export default Dashboard;