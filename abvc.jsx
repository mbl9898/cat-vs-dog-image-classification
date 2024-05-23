import React from "react";
import { Helmet } from "react-helmet";

const MetaTags = ({ title, image, description, url }) => (
  <Helmet>
    <meta property="og:title" content={title} />
    <meta property="og:image" content={image} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={url} />
    <meta property="og:type" content="website" />
    <title>{title}</title>
  </Helmet>
);

const LinkPage = () => {
  const title = "Your Page Title";
  const image = "https://example.com/path/to/image.jpg";
  const description = "A brief description of your page content.";
  const url = "https://example.com/your-page-url";

  return (
    <div>
      <MetaTags
        url={url}
        title={title}
        image={image}
        description={description}
      />
      <h1>Welcome to Your Page</h1>
      <p>
        This is an example of a webpage with Open Graph tags for title and
        image.
      </p>
    </div>
  );
};

export default LinkPage;
