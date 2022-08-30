#!/usr/bin/env python
# -*- coding:  utf-8 -*-
"""
adisp
~~~~~

Adisp is a library that allows structuring code with asynchronous calls and
callbacks without defining callbacks as separate functions. The code then
becomes sequential and easy to read. The library is not a framework by itself
and can be used in other environments that provides asynchronous working model
(see an example with Tornado server in proxy_example.py).

:copyright: (c) 2009-2012 by Ivan Sagalaev.


"""


import sys
import os
try:
    import subprocess
    has_subprocess = True
except:
    has_subprocess = False

from setuptools import Command, setup

try:
    readme_content = open(os.path.join(os.path.abspath(
        os.path.dirname(__file__)), "README.rst")).read()
except Exception as e:
    print(e)
    readme_content = __doc__

VERSION = "0.0.3"

py_ver = sys.version_info

#: Python 2.x?
is_py2 = (py_ver[0] == 2)

#: Python 3.x?
is_py3 = (py_ver[0] == 3)

install_requires = []

if not (is_py3 or (is_py2 and py_ver[1] >= 7)):
    install_requires.append("importlib==1.0.2")

setup(
    name="adisp",
    version=VERSION,
    description="Callback-less python async calls dispatcher",
    long_description=readme_content,
    author="Ivan Sagalaev",
    author_email="maniac@softwaremaniacs.org",
    maintainer=" van Sagalaev",
    maintainer_email="maniac@softwaremaniacs.org",
    url="https://code.launchpad.net/~isagalaev/adisp/trunk",
    packages=["adisp"],
    platforms = ['Linux', 'Mac'],
    classifiers=[
        "Environment :: Web Environment",
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Operating System :: MacOS :: MacOS X",
        "Operating System :: POSIX",
        "Topic :: Internet",
        "Topic :: Software Development :: Libraries"
        ],
    )
