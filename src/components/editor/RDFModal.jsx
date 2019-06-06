// Copyright 2019 Stanford University see LICENSE for license

import React from 'react'
import Button from 'react-bootstrap/lib/Button'
import Modal from 'react-bootstrap/lib/Modal'
import PropTypes from 'prop-types'

const RDFModal = props => (
  <div>
    <Modal show={props.show} bsSize="lg">
      <Modal.Header>
        <Modal.Title>
          RDF Preview
        </Modal.Title>
        <div>
          If this looks good, then click Save and Publish
        </div>
        <div style={{ float: 'right', marginTop: '-47px' }}>
          <Button className="btn-link" style={{ paddingRight: '20px' }} onClick={props.close}>
            Cancel
          </Button>
          <Button className="btn btn-primary btn-sm" onClick={ props.save }>
            Save & Publish
          </Button>
        </div>
      </Modal.Header>
      <Modal.Body bsClass={'rdf-modal-content'}>
        <pre>{props.rdf}</pre>
      </Modal.Body>
    </Modal>
  </div>
)

RDFModal.propTypes = {
  close: PropTypes.func,
  save: PropTypes.func,
  rtId: PropTypes.string,
  show: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  rdf: PropTypes.string,
}

export default RDFModal
