// src/Layout.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Header from '../Header';

const Layout = ({ children, hideHeader = false }) => {
  return (
    <>
      {!hideHeader && <Header />}
      <main>{children}</main>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  hideHeader: PropTypes.bool,
};

export default Layout;
