jest.mock('find-parent-dir');

var importer = require('./');
var mockFindParentDir = require('find-parent-dir');

var mock = require('mock-fs');

describe('Importer', function() {
  beforeEach(function() {
    mockFindParentDir.sync.mockReturnValue('MOCK_PARENT_DIR').mockClear();

    mock({
      MOCK_PARENT_DIR: {
        node_modules: {
          'my-module': {
            mydir: mock.directory({
              items: {
                index: ''
              }
            }),
            index: '',
            'test.scss': '',
            '_partial.scss': ''
          }
        }
      }
    });
  });
  afterEach(mock.restore);

  test('recursively resolve url until package has not been found', function() {
    var mockParentDirFinder = mockFindParentDir.sync;

    // url can not be resolved up to 10 level
    for (var i = 0; i < 10; i++) {
      mockParentDirFinder = mockParentDirFinder.mockReturnValueOnce('MOCK_PARENT_DIR' + i);
    }

    mockParentDirFinder = mockParentDirFinder.mockReturnValueOnce('MOCK_PARENT_DIR');
    expect(importer('~my-module/test', '')).toEqual({
      file: __dirname + '/MOCK_PARENT_DIR/node_modules/my-module/test.scss'
    });

    expect(mockParentDirFinder.mock.calls.length).toBe(11);
  });

  test('resolves to node_modules directory when first character is ~', function() {
    expect(importer('~my-module', '')).toEqual({
      file: __dirname + '/MOCK_PARENT_DIR/node_modules/my-module/index'
    });
  });

  test('does nothing when the first character isnt a ~', function() {
    expect(importer('my-module', '')).toEqual(null);
  });

  test('return null when package file can not be resolved', function() {
    // mockFs.existsSync.mockReturnValue(false);
    mockFindParentDir.sync.mockReturnValue(null);
    expect(importer('~my-unresolvable-module', '')).toEqual({ file: null });
  });

  test('should resolve extensions', function() {
    expect(importer('~my-module/test.scss', '')).toEqual({
      file: __dirname + '/MOCK_PARENT_DIR/node_modules/my-module/test.scss'
    });
  });

  test('should support file imports minus extension', function() {
    expect(importer('~my-module/test', '')).toEqual({
      file: __dirname + '/MOCK_PARENT_DIR/node_modules/my-module/test.scss'
    });
  });

  test('should support partial imports', function() {
    expect(importer('~my-module/partial', '')).toEqual({
      file: __dirname + '/MOCK_PARENT_DIR/node_modules/my-module/partial.scss'
    });
  });

  test('should support directory imports', function() {
    expect(importer('~my-module/mydir', '')).toEqual({
      file: __dirname + '/MOCK_PARENT_DIR/node_modules/my-module/mydir/index'
    });
  });
});
