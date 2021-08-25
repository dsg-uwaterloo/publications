# DSG Publications automation

This is a Python script which pulls publication lists from DBLP for the specified set of authors and automatically updates the Data Systems Group publications website using [Selenium][0].

## Usage

The entire script is stored as a [Jupyter Notebook][1]. Use [Conda][2] or your favorite Python package manager to install the following packages:

* jupyterlab
* pprint
* titlecase
* bibtexparser
* selenium + a webdriver

Then start Jupyter using `jupyter lab` and open `Automate.ipynb`. The notebook contains comments explaining how the code is structured and how to use it.

[0] https://www.selenium.dev
[1] https://jupyter.org
[2] https://www.anaconda.com/products/individual
